import { TonService } from '../services/tonService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tonService = new TonService();
  const form = document.getElementById('transferForm');
  const status = document.getElementById('status');
  const backBtn = document.getElementById('backBtn');

  // Aguardar autenticação da carteira
  try {
    status.textContent = 'Status: Verificando conexão com a carteira...';
    console.log('Iniciando verificação de conexão em transfer.html');
    const { connected, address } = await tonService.checkConnection();
    
    if (!connected) {
      status.textContent = 'Status: Nenhuma carteira conectada. Redirecionando para login...';
      console.log('Conexão não detectada, redirecionando para index.html');
      setTimeout(() => window.location.href = 'index.html', 2000); // Delay para mostrar mensagem
      return;
    }
    
    status.textContent = `Status: Conectado como ${address}`;
    console.log('Conexão confirmada:', address);
  } catch (error) {
    console.error('Erro na verificação da conexão:', error);
    status.textContent = 'Status: Erro ao verificar conexão. Redirecionando para login...';
    setTimeout(() => window.location.href = 'index.html', 2000); // Delay para mostrar mensagem
    return;
  }

  // Lógica de transferência
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const address = document.getElementById('address').value;
    const amount = document.getElementById('amount').value;

    if (!address || !amount || amount <= 0) {
      status.textContent = 'Status: Insira um endereço e valor válidos.';
      console.log('Validação de entrada falhou:', { address, amount });
      return;
    }

    if (!tonService.validateAddress(address)) {
      status.textContent = 'Status: Endereço inválido. Deve ter 48 caracteres, começar com EQ, UQ, 0Q ou kQ, e conter apenas caracteres base64.';
      console.log('Endereço inválido:', address);
      return;
    }

    try {
      status.textContent = 'Status: Enviando transação...';
      console.log('Enviando transação:', { address, amount });
      const result = await tonService.sendTransaction(address, amount);
      status.textContent = `Transação concluída com sucesso!
        - Hash: ${result.hash}
        - Endereço de destino: ${result.address}
        - Valor: ${result.amount} TON
        - Rede: ${result.network}`;
      console.log('Transação concluída:', result);
    } catch (error) {
      console.error('Erro na transação:', error);
      status.textContent = `Status: Erro - ${error.message || 'Falha na transação'}`;
    }
  });

  // Botão de voltar
  backBtn.addEventListener('click', () => {
    console.log('Botão de voltar clicado, redirecionando para index.html');
    window.location.href = 'index.html';
  });
});