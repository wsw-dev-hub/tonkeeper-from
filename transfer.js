import { TonConnectUI } from '@tonconnect/ui';

document.addEventListener('DOMContentLoaded', () => {
  const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://wsw-dev-hub.github.io/tonkeeper-from/tonconnect-manifest.json',
    network: 'testnet'
  });

  const form = document.getElementById('transferForm');
  const status = document.getElementById('status');
  const backBtn = document.getElementById('backBtn');

  // Verifica se a carteira está conectada
  if (!tonConnectUI.connected) {
    status.textContent = 'Status: Nenhuma carteira conectada. Redirecionando para login...';
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return;
  }

  // Lógica de transferência
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const address = document.getElementById('address').value;
    const amount = document.getElementById('amount').value;

    if (!address || !amount || amount <= 0) {
      status.textContent = 'Status: Insira um endereço e valor válidos.';
      return;
    }

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: address, // Endereço inserido pelo usuário
            amount: (parseFloat(amount) * 1e9).toString() // Converte TON para nanoTON
          }
        ]
      };

      status.textContent = 'Status: Enviando transação...';
      const result = await tonConnectUI.sendTransaction(transaction);
      status.textContent = `Status: Transação enviada! Hash: ${result.boc}`;
    } catch (error) {
      console.error('Erro:', error);
      status.textContent = `Status: Erro - ${error.message || 'Falha na transação'}`;
    }
  });

  // Botão de voltar
  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
});