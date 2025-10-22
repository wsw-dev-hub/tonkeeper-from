import { TonService } from '../services/tonService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tonService = new TonService();
  const form = document.getElementById('transferForm');
  const status = document.getElementById('status');
  const balanceElement = document.getElementById('balance');
  const backBtn = document.getElementById('backBtn');

  // Função para atualizar o saldo com retries
  const updateBalance = async (retries = 3, retryDelay = 2000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Tentativa ${attempt} de atualizar saldo`);
        const balance = await tonService.getBalance();
        balanceElement.textContent = `Saldo: ${balance} TON`;
        console.log('Saldo atualizado:', balance);
        return true;
      } catch (error) {
        console.error(`Tentativa ${attempt} de obter saldo falhou:`, error);
        if (attempt === retries) {
          balanceElement.textContent = `Saldo: Erro ao carregar`;
          status.textContent = `Status: Erro ao obter saldo - ${error.message || 'Tente novamente.'}`;
          return false;
        }
        console.log(`Aguardando ${retryDelay}ms antes da próxima tentativa`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    return false;
  };

  // Função para encerrar a sessão
  const endSession = async () => {
    try {
      console.log('Encerrando sessão: desconectando carteira e limpando sessionStorage');
      await tonService.disconnectWallet();
      sessionStorage.removeItem('authenticatedWallet');
      console.log('Sessão encerrada: sessionStorage limpo e carteira desconectada');
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      status.textContent = `Status: Erro ao encerrar sessão - ${error.message || 'Tente novamente.'}`;
      throw error;
    }
  };

  // Obter endereço autenticado do sessionStorage
  const authenticatedWallet = sessionStorage.getItem('authenticatedWallet');
  console.log('Endereço autenticado do sessionStorage:', authenticatedWallet);

  // Aguardar autenticação da carteira e carregar saldo
  try {
    status.textContent = 'Status: Verificando conexão com a carteira...';
    console.log('Iniciando verificação de conexão em transfer.html');
    const { connected, address } = await tonService.checkConnection();
    
    if (!connected || (authenticatedWallet && address !== authenticatedWallet)) {
      status.textContent = `Status: ${!connected ? 'Nenhuma carteira conectada' : 'Carteira diferente da autenticada'}. Conecte a carteira correta para continuar.`;
      console.log('Conexão inválida, mantendo usuário na página');
      balanceElement.textContent = 'Saldo: N/A';
      return;
    }
    
    status.textContent = `Status: Conectado como ${address}`;
    console.log('Conexão confirmada:', address);
    await updateBalance(); // Carregar saldo inicial
  } catch (error) {
    console.error('Erro na verificação da conexão:', error);
    status.textContent = `Status: Erro ao verificar conexão - ${error.message || 'Tente novamente ou conecte a carteira.'}`;
    balanceElement.text = 'Saldo: Erro ao carregar';
    return;
  }

  // Lógica de transferência com confirmação do usuário
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const address = document.getElementById('address').value;
    const amount = document.getElementById('amount').value;

    if (!address || !amount || amount <= 0) {
      status.textContent = 'Status: Insira um endereço e valor válidos.';
      console.log('Validação de entrada falhou:', { address, amount });
      return;
    }

    if (!tonService.validateAddress(address)) {
      status.textContent = 'Status: Endereço inválido. Deve ter 48 caracteres, começar com EQ, UQ, 0Q ou kQ, e conter apenas caracteres base64.';
      console.log('Endereço inválido:', address);
      return;
    }

    // Verificar se a carteira atual é a autenticada
    const currentWallet = await tonService.getCurrentWalletAddress();
    if (authenticatedWallet && currentWallet !== authenticatedWallet) {
      status.textContent = 'Status: Carteira atual não corresponde à autenticada. Conecte a carteira correta.';
      console.log('Carteira atual não corresponde:', { currentWallet, authenticatedWallet });
      return;
    }

    // Solicitar confirmação do usuário
    const confirmTransaction = window.confirm(
      `Você deseja enviar ${amount} TON para o endereço ${address} usando a carteira ${currentWallet} na testnet?`
    );
    if (!confirmTransaction) {
      status.textContent = 'Status: Transação cancelada pelo usuário.';
      console.log('Transação cancelada pelo usuário');
      return;
    }

    try {
      status.textContent = 'Status: Aguardando confirmação da carteira...';
      console.log('Enviando transação:', { address, amount, wallet: currentWallet });
      const result = await tonService.sendTransaction(address, amount);
      status.textContent = 'Status: Transação enviada. Aguardando 10 segundos para confirmação na blockchain...';
      console.log('Transação enviada, aguardando 10 segundos para atualizar saldo');

      // Aguardar 10 segundos antes de atualizar o saldo
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Atualizar saldo com retries
      const updated = await updateBalance();
      if (updated) {
        status.textContent = `Transação concluída com sucesso!
          - Hash: ${result.hash}
          - Endereço de destino: ${result.address}
          - Valor: ${result.amount} TON
          - Rede: ${result.network}`;
        console.log('Transação concluída e saldo atualizado:', result);
      } else {
        status.textContent = `Transação enviada, mas falha ao atualizar saldo:
          - Hash: ${result.hash}
          - Endereço de destino: ${result.address}
          - Valor: ${result.amount} TON
          - Rede: ${result.network}`;
        console.log('Transação concluída, mas saldo não atualizado:', result);
      }
    } catch (error) {
      console.error('Erro na transação:', error);
      status.textContent = `Status: Erro - ${error.message || 'Falha na transação. Tente novamente.'}`;
    }
  });

  // Botão de voltar
  backBtn.addEventListener('click', async () => {
    status.textContent = 'Status: Encerrando sessão...';
    try {
      await endSession();
      console.log('Redirecionando para index.html após encerramento da sessão');
      window.location.href = 'index.html';
    } catch (error) {
      console.log('Redirecionamento cancelado devido a erro na desconexão');
    }
  });
});