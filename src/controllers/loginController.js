import { TonService } from '../services/tonService.js';

document.addEventListener('DOMContentLoaded', () => {
  const tonService = new TonService();
  const connectBtn = document.getElementById('connectBtn');
  const status = document.getElementById('status');

  connectBtn.addEventListener('click', async () => {
    try {
      status.textContent = 'Status: Solicitando conexão com a carteira...';
      console.log('Solicitando conexão com a carteira');
      const walletAddress = await tonService.connectWallet();
      
      status.textContent = 'Status: Verificando conexão...';
      console.log('Verificando estado da conexão');
      const { connected, address } = await tonService.checkConnection();
      
      if (connected) {
        status.textContent = `Status: Carteira conectada (${address}). Redirecionando...`;
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