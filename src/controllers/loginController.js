import { TonService } from '../services/tonService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tonService = new TonService();
  const connectBtn = document.getElementById('connectBtn');
  const status = document.getElementById('status');

  try {
    status.textContent = 'Status: Verificando carteira em cache...';
    console.log('Verificando carteira em cache ao carregar index.html');
    const { connected, address } = await tonService.checkConnection();
    const authenticatedWallet = sessionStorage.getItem('authenticatedWallet');

    if (connected && authenticatedWallet && address === authenticatedWallet) {
      console.log('Carteira em cache detectada:', address);
      status.textContent = `Status: Carteira conectada (${address}). Redirecionando para transfer.html...`;
      setTimeout(() => window.location.href = 'transfer.html', 1000);
      return;
    } else if (connected) {
      console.log('Carteira conectada não corresponde ao authenticatedWallet, desconectando');
      await tonService.disconnectWallet();
      status.textContent = 'Status: Carteira anterior desconectada. Conecte uma nova carteira.';
    } else {
      console.log('Nenhuma carteira conectada em cache');
      status.textContent = 'Status: Nenhuma carteira conectada. Conecte uma carteira.';
    }
  } catch (error) {
    console.warn('Erro ao verificar carteira em cache:', error);
    try {
      sessionStorage.removeItem('ton-connect-storage_bridge-connection');
      sessionStorage.removeItem('ton-connect-storage_protocol-version');
      console.log('sessionStorage limpo após falha na verificação');
      status.textContent = 'Status: Nenhuma carteira conectada. Conecte uma carteira.';
    } catch (cleanError) {
      console.error('Erro ao limpar sessionStorage:', cleanError);
      status.textContent = `Status: Erro ao verificar carteira em cache - ${error.message || 'Tente novamente.'}`;
    }
  }

  connectBtn.addEventListener('click', async () => {
    try {
      status.textContent = 'Status: Solicitando conexão com a carteira...';
      console.log('Solicitando conexão com a carteira');
      const walletAddress = await tonService.connectWallet();
      
      status.textContent = `Status: Carteira conectada (${walletAddress}). Redirecionando...`;
      console.log('Conexão confirmada, armazenando endereço:', walletAddress);
      sessionStorage.setItem('authenticatedWallet', walletAddress);
      setTimeout(() => window.location.href = 'transfer.html', 1000);
    } catch (error) {
      console.error('Erro ao conectar:', error);
      status.textContent = `Status: Erro - ${error.message || 'Falha na conexão. Verifique se a extensão Tonkeeper está ativa e na testnet.'}`;
    }
  });
});