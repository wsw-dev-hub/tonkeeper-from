import { TonConnectUI } from '@tonconnect/ui';

document.addEventListener('DOMContentLoaded', () => {
  const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://raw.githubusercontent.com/ton-connect/demo-dapp/main/tonconnect-manifest.json'
  });

  const form = document.getElementById('tonForm');
  const status = document.getElementById('status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const amount = document.getElementById('amount').value;

    try {
      if (!tonConnectUI.connected) {
        status.textContent = 'Status: Conectando à carteira...';
        await tonConnectUI.connectWallet();
        status.textContent = 'Status: Carteira conectada!';
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            amount: (amount * 1e9).toString()
          }
        ]
      };

      status.textContent = 'Status: Enviando transação...';
      const result = await tonConnectUI.sendTransaction(transaction);
      status.textContent = `Status: Transação enviada! Hash: ${result.boc}`;
    } catch (error) {
      console.error('Erro:', error);
      status.textContent = `Status: Erro - ${error.message}`;
    }
  });
});