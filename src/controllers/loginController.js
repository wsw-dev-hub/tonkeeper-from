import { TonService } from '../services/tonService.js';

document.addEventListener('DOMContentLoaded', () => {
  const tonService = new TonService();
  const connectBtn = document.getElementById('connectBtn');
  const status = document.getElementById('status');

  connectBtn.addEventListener('click', async () => {
    try {
      status.textContent = 'Status: Verificando conexão...';
      const { connected, address } = await tonService.checkConnection();
      if (connected) {
        status.textContent = `Status: Carteira já conectada (${address}). Redirecionando...`;
        window.location.href = 'transfer.html';
        return;
      }

      status.textContent = 'Status: Conectando à carteira...';
      const walletAddress = await tonService.connectWallet();
      status.textContent = `Status: Carteira conectada (${walletAddress}). Redirecionando...`;
      window.location.href = 'transfer.html';
    } catch (error) {
      console.error('Erro:', error);
      status.textContent = `Status: Erro - ${error.message || 'Falha na conexão'}`;
    }
  });
});