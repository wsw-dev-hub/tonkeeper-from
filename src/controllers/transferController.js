import { TonService } from '../services/tonService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tonService = new TonService();
  const form = document.getElementById('transferForm');
  const operationMessage = document.getElementById('operation-message');
  const hashElement = document.getElementById('hash');
  const addressElement = document.getElementById('address');
  const amountElement = document.getElementById('amount');
  const networkElement = document.getElementById('network');
  const balanceElement = document.getElementById('balance');
  const backBtn = document.getElementById('backBtn');

  // Função para atualizar o saldo com retries
  const updateBalance = async (retries = 5, retryDelay = 3000) => {
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
          operationMessage.textContent = `Status: Erro ao obter saldo - ${error.message || 'Tente novamente.'}`;
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
      operationMessage.textContent = `Status: Erro ao encerrar sessão - ${error.message || 'Tente novamente.'}`;
      throw error;
    }
  };

  // Obter endereço autenticado do sessionStorage
  const authenticatedWallet = sessionStorage.getItem('authenticatedWallet');
  console.log('Endereço autenticado do sessionStorage:', authenticatedWallet);

  // Aguardar autenticação da carteira e carregar saldo
  try {
    operationMessage.textContent = 'Status: Verificando conexão com a carteira...';
    console.log('Iniciando verificação de conexão em transfer.html');
    const { connected, address } = await tonService.checkConnection();
    
    if (!connected || (authenticatedWallet && address !== authenticatedWallet)) {
      operationMessage.textContent = `Status: ${!connected ? 'Nenhuma carteira conectada' : 'Carteira diferente da autenticada'}. Conecte a carteira correta para continuar.`;
      console.log('Conexão inválida, mantendo usuário na página');
      balanceElement.textContent = 'Saldo: N/A';
      hashElement.textContent = 'Hash: -';
      addressElement.textContent = `Endereço da Carteira: ${address || '-'}`;
      amountElement.textContent = 'Valor: -';
      networkElement.textContent = 'Rede: -';
      return;
    }
    
    operationMessage.textContent = `Status: Conectado como ${address}`;
    addressElement.textContent = `Endereço da Carteira: ${address}`; // Exibir endereço da carteira
    console.log('Conexão confirmada:', address);
    await updateBalance(); // Carregar saldo inicial
  } catch (error) {
    console.error('Erro na verificação da conexão:', error);
    operationMessage.textContent = `Status: Erro ao verificar conexão - ${error.message || 'Tente novamente ou conecte a carteira.'}`;
    balanceElement.textContent = 'Saldo: Erro ao carregar';
    hashElement.textContent = 'Hash: -';
    addressElement.textContent = `Endereço da Carteira: ${authenticatedWallet || '-'}`;
    amountElement.textContent = 'Valor: -';
    networkElement.textContent = 'Rede: -';
    return;
  }

  // Lógica de transferência com confirmação do usuário
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const address = document.getElementById('address').value;
    const amount = document.getElementById('amount').value;

    if (!address || !amount || amount <= 0) {
      operationMessage.textContent = 'Status: Insira um endereço e valor válidos.';
      console.log('Validação de entrada falhou:', { address, amount });
      return;
    }

    if (!tonService.validateAddress(address)) {
      operationMessage.textContent = 'Status: Endereço inválido. Deve ter 48 caracteres, começar com EQ, UQ, 0Q ou kQ, e conter apenas caracteres base64.';
      console.log('Endereço inválido:', address);
      return;
    }

    // Verificar se a carteira atual é a autenticada
    const currentWallet = await tonService.getCurrentWalletAddress();
    if (authenticatedWallet && currentWallet !== authenticatedWallet) {
      operationMessage.textContent = 'Status: Carteira atual não corresponde à autenticada. Conecte a carteira correta.';
      console.log('Carteira atual não corresponde:', { currentWallet, authenticatedWallet });
      return;
    }

    // Solicitar confirmação do usuário
    /*const confirmTransaction = window.confirm(
      `Você deseja enviar ${amount} TON para o endereço ${address} usando a carteira ${currentWallet} na testnet?`
    );
    if (!confirmTransaction) {
      operationMessage.textContent = 'Status: Transação cancelada pelo usuário.';
      console.log('Transação cancelada pelo usuário');
      return;
    }*/

    try {
      operationMessage.textContent = 'Status: Aguardando confirmação da carteira...';
      console.log('Enviando transação:', { address, amount, wallet: currentWallet });
      const result = await tonService.sendTransaction(address, amount);
      operationMessage.textContent = 'Status: Transação enviada. Aguardando 10 segundos para confirmação na blockchain...';
      console.log('Transação enviada:', result);

      // Aguardar 10 segundos antes de atualizar o saldo
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Atualizar saldo com retries
      const updated = await updateBalance();
      if (updated) {
        operationMessage.textContent = 'Status: Transação concluída com sucesso!';
        hashElement.textContent = `Hash: ${result.hash}`;
        addressElement.textContent = `Endereço da Carteira: ${currentWallet}`; // Atualizar endereço da carteira
        amountElement.textContent = `Valor: ${parseFloat(amount).toFixed(4)} TON`; // Usar valor do input
        networkElement.textContent = `Rede: ${result.network}`;
        console.log('Transação concluída e saldo atualizado:', result);
      } else {
        operationMessage.textContent = 'Status: Transação enviada, mas falha ao atualizar saldo.';
        hashElement.textContent = `Hash: ${result.hash}`;
        addressElement.textContent = `Endereço da Carteira: ${currentWallet}`;
        amountElement.textContent = `Valor: ${parseFloat(amount).toFixed(4)} TON`;
        networkElement.textContent = `Rede: ${result.network}`;
        console.log('Transação concluída, mas saldo não atualizado:', result);
      }
    } catch (error) {
      console.error('Erro na transação:', error);
      operationMessage.textContent = `Status: Erro - ${error.message || 'Falha na transação. Tente novamente.'}`;
      hashElement.textContent = 'Hash: -';
      addressElement.textContent = `Endereço da Carteira: ${currentWallet || '-'}`;
      amountElement.textContent = 'Valor: -';
      networkElement.textContent = 'Rede: -';
    }
  });

  // Botão de voltar
  backBtn.addEventListener('click', async () => {
    operationMessage.textContent = 'Status: Encerrando sessão...';
    try {
      await endSession();
      console.log('Redirecionando para index.html após encerramento da sessão');
      window.location.href = 'index.html';
    } catch (error) {
      console.log('Redirecionamento cancelado devido a erro na desconexão');
    }
  });
});