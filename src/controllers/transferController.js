import { TonService } from '../services/tonService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tonService = new TonService();
  const form = document.getElementById('transferForm');
  const status = document.getElementById('status');
  const backBtn = document.getElementById('backBtn');

  // Obter endereço autenticado do sessionStorage
  const authenticatedWallet = sessionStorage.getItem('authenticatedWallet');
  console.log('Endereço autenticado do sessionStorage:', authenticatedWallet);

  // Aguardar autenticação da carteira
  try {
    status.textContent = 'Status: Verificando conexão com a carteira...';
    console.log('Iniciando verificação de conexão em transfer.html');
    const { connected, address } = await tonService.checkConnection();
    
    if (!connected || (authenticatedWallet && address !== authenticatedWallet)) {
      status.textContent = `Status: ${!connected ? 'Nenhuma carteira conectada' : 'Carteira diferente da autenticada'}. Conecte a carteira correta para continuar.`;
      console.log('Conexão inválida, mantendo usuário na página');
      return;
    }
    
    status.textContent = `Status: Conectado como ${address}`;
    console.log('Conexão confirmada:', address);
  } catch (error) {
    console.error('Erro na verificação da conexão:', error);
    status.textContent = `Status: Erro ao verificar conexão - ${error.message || 'Tente novamente ou conecte a carteira.'}`;
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

    // Verificar se a carteira atual é a autenticada antes da transação
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
      status.textContent = `Transação concluída com sucesso!
        - Hash: ${result.hash}
        - Endereço de destino: ${result.address}
        - Valor: ${result.amount} TON
        - Rede: ${result.network}`;
      console.log('Transação concluída:', result);
    } catch (error) {
      console.error('Erro na transação:', error);
      status.textContent = `Status: Erro - ${error.message || 'Falha na transação. Tente novamente.'}`;
    }
  });

  // Botão de voltar
  backBtn.addEventListener('click', async () => {
    console.log('Botão de voltar clicado, desconectando carteira e limpando sessionStorage');
    try {
      await tonService.disconnectWallet();
      sessionStorage.removeItem('authenticatedWallet');
      console.log('sessionStorage limpo e carteira desconectada');
    } catch (error) {
      console.error('Erro ao desconectar carteira:', error);
    }
    window.location.href = 'index.html';
  });
});