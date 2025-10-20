import { TonService } from '../services/tonService.js';

document.addEventListener('DOMContentLoaded', () => {
  const tonService = new TonService();
  const connectBtn = document.getElementById('connectBtn');
  const status = document.getElementById('status');

  connectBtn.addEventListener('click', async () => {
    try {
      status.textContent = 'Status: Verificando conexão...';
      console.log('Chamando checkConnection');
      const { connected, address } = await tonService.checkConnection();
      if (connected) {
        status.textContent = `Status: Carteira já conectada (${address}). Redirecionando...`;
        console.log('Conexão confirmada, redirecionando para transfer.html');
        window.location.href = 'transfer.html';
        return;
      }

      status.textContent = 'Status: Conectando à carteira...';
      console.log('Chamando connectWallet');
      const walletAddress = await tonService.connectWallet();
      status.textContent = `Status: Carteira conectada (${walletAddress}). Redirecionando...`;
      console.log('Carteira conectada, redirecionando para transfer.html');
      window.location.href = 'transfer.html';
    } catch (error) {
      console.error('Erro ao conectar:', error);
      status.textContent = `Status: Erro - Falha na conexão. Verifique se a extensão Tonkeeper está ativa e na testnet.`;
    }
  });
});