import { TonConnectUI } from '@tonconnect/ui';

document.addEventListener('DOMContentLoaded', () => {
  const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://wsw-dev-hub.github.io/tonkeeper-from/tonconnect-manifest.json',
    network: 'testnet'
  });

  const form = document.getElementById('transferForm');
  const status = document.getElementById('status');
  const backBtn = document.getElementById('backBtn');

  // Verifica conexão com a carteira
  if (!tonConnectUI.connected) {
    status.textContent = 'Status: Nenhuma carteira conectada. Redirecionando para login...';
    window.location.href = 'index.html';
    return;
  } else {
    // Exibe o endereço da carteira conectada
    const walletAddress = tonConnectUI.account?.address || 'Desconhecido';
    status.textContent = `Status: Conectado como ${walletAddress}`;
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

    // Validação simples de endereço TON (formato básico)
    if (!address.startsWith('EQ') && !address.startsWith('UQ')) {
      status.textContent = 'Status: Endereço inválido. Deve começar com EQ ou UQ.';
      return;
    }

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: address,
            amount: (parseFloat(amount) * 1e9).toString() // Converte TON para nanoTON
          }
        ]
      };

      status.textContent = 'Status: Enviando transação...';
      const result = await tonConnectUI.sendTransaction(transaction);
      
      // Mensagem detalhada da transação
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