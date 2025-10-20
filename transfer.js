import { TonConnectUI } from '@tonconnect/ui';

document.addEventListener('DOMContentLoaded', async () => {
  const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://wsw-dev-hub.github.io/tonkeeper-from/tonconnect-manifest.json',
    network: 'testnet'
  });

  const form = document.getElementById('transferForm');
  const status = document.getElementById('status');
  const backBtn = document.getElementById('backBtn');

  // Verifica o estado da conexão de forma assíncrona
  try {
    await new Promise((resolve, reject) => {
      tonConnectUI.onStatusChange((walletInfo) => {
        if (walletInfo) {
          resolve(walletInfo);
        } else {
          reject(new Error('Nenhuma carteira conectada'));
        }
      }, (error) => {
        reject(error);
      });
      setTimeout(() => reject(new Error('Timeout na verificação da conexão')), 5000);
    });

    const walletAddress = tonConnectUI.account?.address || 'Desconhecido';
    status.textContent = `Status: Conectado como ${walletAddress}`;
  } catch (error) {
    console.error('Erro na verificação da conexão:', error);
    status.textContent = 'Status: Nenhuma carteira conectada. Redirecionando para login...';
    window.location.href = 'index.html';
    return;
  }

  // Lógica de transferência
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const address = document.getElementById('address').value;
    const amount = document.getElementById('amount').value;

    // Validação básica
    if (!address || !amount || amount <= 0) {
      status.textContent = 'Status: Insira um endereço e valor válidos.';
      return;
    }

    // Validação de endereço TON
    const validPrefixes = ['EQ', 'UQ', '0Q', 'kQ'];
    const isValidPrefix = validPrefixes.some(prefix => address.startsWith(prefix));
    const isValidLength = address.length === 48;
    const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(address);

    if (!isValidPrefix || !isValidLength || !isValidBase64) {
      status.textContent = 'Status: Endereço inválido. Deve ter 48 caracteres, começar com EQ, UQ, 0Q ou kQ, e conter apenas caracteres base64.';
      return;
    }

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: address,
            amount: (parseFloat(amount) * 1e9).toString()
          }
        ]
      };

      status.textContent = 'Status: Enviando transação...';
      const result = await tonConnectUI.sendTransaction(transaction);
      
      status.textContent = `Transação concluída com sucesso!
        - Hash: ${result.boc}
        - Endereço de destino: ${address}
        - Valor: ${amount} TON
        - Rede: Testnet`;
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