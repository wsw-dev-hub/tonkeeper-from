import { TonConnectUI } from '@tonconnect/ui';

document.addEventListener('DOMContentLoaded', () => {
  const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://wsw-dev-hub.github.io/tonkeeper-from/tonconnect-manifest.json',
    network: 'testnet'
  });

  const connectBtn = document.getElementById('connectBtn');
  const status = document.getElementById('status');

  connectBtn.addEventListener('click', async () => {
    try {
      // Verifica se a carteira já está conectada
      if (tonConnectUI.connected) {
        status.textContent = 'Status: Carteira já conectada! Redirecionando...';
        window.location.href = 'transfer.html';
        return;
      }

      // Tenta conectar a carteira
      status.textContent = 'Status: Conectando à carteira...';
      await tonConnectUI.connectWallet();
      status.textContent = 'Status: Carteira conectada! Redirecionando...';
      window.location.href = 'transfer.html';
    } catch (error) {
      console.error('Erro:', error);
      status.textContent = `Status: Erro - ${error.message || 'Falha na conexão'}`;
    }
  });
});