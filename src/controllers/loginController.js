import { TonService } from '../services/tonService.js';

document.addEventListener('DOMContentLoaded', () => {
  const tonService = new TonService();
  const connectBtn = document.getElementById('connectBtn');
  const status = document.getElementById('status');

  connectBtn.addEventListener('click', async () => {
    try {
      status.textContent = 'Status: Verificando conexão existente...';
      console.log('Verificando conexão existente antes de conectar');

      // Verificar se já há uma carteira conectada
      const { connected, address } = await tonService.checkConnection();
      if (connected) {
        console.log('Carteira já conectada:', address);
        status.textContent = `Status: Carteira já conectada (${address}). Desconectando para nova conexão...`;
        await tonService.disconnectWallet();
        console.log('Carteira desconectada para permitir nova conexão');
      }

      status.textContent = 'Status: Solicitando conexão com a carteira...';
      console.log('Solicitando conexão com a carteira');
      const walletAddress = await tonService.connectWallet();
      
      status.textContent = 'Status: Verificando conexão...';
      console.log('Verificando estado da conexão');
      const { connected: verifiedConnected, address: verifiedAddress } = await tonService.checkConnection();
      
      if (verifiedConnected) {
        // Armazenar endereço no sessionStorage após confirmação
        sessionStorage.setItem('authenticatedWallet', verifiedAddress);
        console.log('Endereço armazenado no sessionStorage:', verifiedAddress);
        status.textContent = `Status: Carteira conectada (${verifiedAddress}). Redirecionando...`;
        console.log('Conexão confirmada, redirecionando para transfer.html');
        window.location.href = 'transfer.html';
      } else {
        throw new Error('Falha ao verificar a conexão após confirmação');
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      status.textContent = `Status: Erro - ${error.message || 'Falha na conexão. Verifique se a extensão Tonkeeper está ativa e na testnet.'}`;
    }
  });
});