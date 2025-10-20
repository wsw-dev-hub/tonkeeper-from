import { TonService } from '../services/tonService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tonService = new TonService();
  const form = document.getElementById('transferForm');
  const status = document.getElementById('status');
  const backBtn = document.getElementById('backBtn');

  // Verifica conexão
  try {
    const { connected, address } = await tonService.checkConnection();
    if (!connected) {
      status.textContent = 'Status: Nenhuma carteira conectada. Redirecionando para login...';
      window.location.href = 'index.html';
      return;
    }
    status.textContent = `Status: Conectado como ${address}`;
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

    if (!address || !amount || amount <= 0) {
      status.textContent = 'Status: Insira um endereço e valor válidos.';
      return;
    }

    if (!tonService.validateAddress(address)) {
      status.textContent = 'Status: Endereço inválido. Deve ter 48 caracteres, começar com EQ, UQ, 0Q ou kQ, e conter apenas caracteres base64.';
      return;
    }

    try {
      status.textContent = 'Status: Enviando transação...';
      const result = await tonService.sendTransaction(address, amount);
      status.textContent = `Transação concluída com sucesso!
        - Hash: ${result.hash}
        - Endereço de destino: ${result.address}
        - Valor: ${result.amount} TON
        - Rede: ${result.network}`;
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