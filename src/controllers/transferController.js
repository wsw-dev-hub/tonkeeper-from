import { TonService } from '../services/tonService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tonService = new TonService();
  const form = document.getElementById('transferForm');
  const operationMessage = document.getElementById('operation-message');
  const senderAddressElement = document.getElementById('sender-address');
  const recipientAddressElement = document.getElementById('recipient-address');
  const transferredAmountElement = document.getElementById('transferred-amount');
  const networkFeeElement = document.getElementById('network-fee');
  const hashElement = document.getElementById('hash');
  const networkElement = document.getElementById('network');
  const balanceElement = document.getElementById('balance');
  const backBtn = document.getElementById('backBtn');

  // Função para atualizar o saldo com retries
  const updateBalance = async (retries = 7, retryDelay = 5000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Tentativa ${attempt} de atualizar saldo`);
        const { connected } = await tonService.checkConnection();
        if (!connected) {
          throw new Error('Carteira desconectada durante atualização de saldo');
        }
        const balance = await tonService.getBalance();
        balanceElement.textContent = `Saldo: ${balance} TON`;
        console.log('Saldo atualizado:', balance);
        return true;
      } catch (error) {
        console.error(`Tentativa ${attempt} de obter saldo falhou:`, error);
        if (attempt === retries) {
          const previousBalance = balanceElement.textContent.includes('Saldo:') ? balanceElement.textContent : 'Saldo: N/A';
          balanceElement.textContent = `Saldo: Não atualizado (${previousBalance})`;
          operationMessage.textContent = `Status: Erro ao obter saldo - ${error.message || 'Tente novamente.'}`;
          return false;
        }
        console.log(`Aguardando ${retryDelay}ms antes da próxima tentativa`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    return false;
  };

  // Função para encerrar a sessão
  const endSession = async () => {
    try {
      console.log('Encerrando sessão: desconectando carteira e limpando sessionStorage');
      await tonService.disconnectWallet();
      sessionStorage.removeItem('authenticatedWallet');
      console.log('Sessão encerrada: sessionStorage limpo e carteira desconectada');
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      operationMessage.textContent = `Status: Erro ao encerrar sessão - ${error.message || 'Tente novamente.'}`;
      throw error;
    }
  };

  // Obter endereço autenticado do sessionStorage
  const authenticatedWallet = sessionStorage.getItem('authenticatedWallet');
  console.log('Endereço autenticado do sessionStorage:', authenticatedWallet);

  // Aguardar autenticação da carteira e carregar saldo
  try {
    operationMessage.textContent = 'Status: Verificando conexão com a carteira...';
    console.log('Iniciando verificação de conexão em transfer.html');
    const { connected, address } = await tonService.checkConnection();
    
    if (!connected || (authenticatedWallet && address !== authenticatedWallet)) {
      operationMessage.textContent = `Status: ${!connected ? 'Nenhuma carteira conectada' : 'Carteira diferente da autenticada'}. Conecte a carteira correta para continuar.`;
      console.log('Conexão inválida, mantendo usuário na página');
      balanceElement.textContent = 'Saldo: N/A';
      senderAddressElement.textContent = `Endereço da Carteira: ${address || authenticatedWallet || 'Desconhecido'}`;
      recipientAddressElement.textContent = 'Endereço de Recebimento: -';
      transferredAmountElement.textContent = 'Valor Transferido: -';
      networkFeeElement.textContent = 'Taxa de Rede: -';
      hashElement.textContent = 'Hash: -';
      networkElement.textContent = 'Rede: -';
      return;
    }
    
    operationMessage.textContent = `Status: Conectado como ${address}`;
    senderAddressElement.textContent = `Endereço da Carteira: ${address}`;
    recipientAddressElement.textContent = 'Endereço de Recebimento: -';
    transferredAmountElement.textContent = 'Valor Transferido: -';
    networkFeeElement.textContent = 'Taxa de Rede: -';
    console.log('Conexão confirmada, endereço da carteira exibido:', address);
    await updateBalance();
  } catch (error) {
    console.error('Erro na verificação da conexão:', error);
    operationMessage.textContent = `Status: Erro ao verificar conexão - ${error.message || 'Tente novamente ou conecte a carteira.'}`;
    balanceElement.textContent = 'Saldo: Erro ao carregar';
    senderAddressElement.textContent = `Endereço da Carteira: ${authenticatedWallet || 'Desconhecido'}`;
    recipientAddressElement.textContent = 'Endereço de Recebimento: -';
    transferredAmountElement.textContent = 'Valor Transferido: -';
    networkFeeElement.textContent = 'Taxa de Rede: -';
    hashElement.textContent = 'Hash: -';
    networkElement.textContent = 'Rede: -';
    return;
  }

  // Lógica de transferência com confirmação do usuário
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const recipientAddress = document.getElementById('address').value.trim();
    const amountInput = document.getElementById('amount').value.trim();
    console.log('Dados do formulário:', { recipientAddress, amountInput });

    if (!recipientAddress || !amountInput) {
      operationMessage.textContent = 'Status: Insira um endereço e valor válidos.';
      console.log('Validação de entrada falhou:', { recipientAddress, amountInput });
      transferredAmountElement.textContent = 'Valor Transferido: -';
      networkFeeElement.textContent = 'Taxa de Rede: -';
      return;
    }

    const normalizedAmountInput = amountInput.replace(',', '.');
    const amount = parseFloat(normalizedAmountInput);
    if (isNaN(amount) || amount <= 0) {
      operationMessage.textContent = 'Status: Valor inválido. Insira um número maior que 0.';
      console.log('Valor inválido:', amountInput);
      transferredAmountElement.textContent = 'Valor Transferido: -';
      networkFeeElement.textContent = 'Taxa de Rede: -';
      return;
    }

    // Validar número de dígitos decimais
    const decimalPart = normalizedAmountInput.split('.')[1];
    if (decimalPart && decimalPart.length > 9) {
      operationMessage.textContent = 'Status: Valor inválido. Máximo de 9 dígitos após o separador decimal.';
      console.log('Validação falhou: mais de 9 dígitos decimais', { amountInput, decimalPart });
      transferredAmountElement.textContent = 'Valor Transferido: -';
      networkFeeElement.textContent = 'Taxa de Rede: -';
      return;
    }

    // Validar se a quantia é superior à taxa de rede
    const estimatedFees = 0.01;
    if (amount <= estimatedFees) {
      operationMessage.textContent = `Status: Valor inválido. A quantia deve ser maior que ${estimatedFees.toFixed(4)} TON.`;
      console.log('Validação falhou: quantia menor ou igual à taxa de rede', { amount, estimatedFees });
      transferredAmountElement.textContent = 'Valor Transferido: -';
      networkFeeElement.textContent = 'Taxa de Rede: -';
      return;
    }

    if (!tonService.validateAddress(recipientAddress)) {
      operationMessage.textContent = 'Status: Endereço inválido. Deve ter 48 caracteres, começar com EQ, UQ, 0Q ou kQ, e conter apenas caracteres base64.';
      console.log('Endereço inválido:', recipientAddress);
      recipientAddressElement.textContent = 'Endereço de Recebimento: -';
      return;
    }

    // Verificar se a carteira atual é a autenticada
    const currentWallet = await tonService.getCurrentWalletAddress();
    console.log('Carteira atual:', currentWallet, 'Autenticada:', authenticatedWallet);
    if (authenticatedWallet && currentWallet !== authenticatedWallet) {
      operationMessage.textContent = 'Status: Carteira atual não corresponde à autenticada. Conecte a carteira correta.';
      console.log('Carteira atual não corresponde:', { currentWallet, authenticatedWallet });
      senderAddressElement.textContent = `Endereço da Carteira: ${currentWallet || authenticatedWallet || 'Desconhecido'}`;
      return;
    }

    // Estimar taxas
    const totalAmount = amount + estimatedFees;

    // Solicitar confirmação do usuário
    /*const confirmTransaction = window.confirm(
      `Você deseja enviar ${amount.toFixed(9)} TON para o endereço ${recipientAddress} usando a carteira ${currentWallet} na testnet?\nTaxa de Rede Estimada: ${estimatedFees.toFixed(4)} TON\nTotal: ${totalAmount.toFixed(9)} TON`
    );
    if (!confirmTransaction) {
      operationMessage.textContent = 'Status: Transação cancelada pelo usuário.';
      console.log('Transação cancelada pelo usuário');
      return;
    }*/

    try {
      operationMessage.textContent = 'Status: Aguardando confirmação da carteira...';
      console.log('Enviando transação:', { recipientAddress, amount, wallet: currentWallet });
      const result = await tonService.sendTransaction(recipientAddress, amount);
      operationMessage.textContent = 'Status: Transação enviada. Aguardando 15 segundos para confirmação na blockchain...';
      //const auditHash = await tonService.getTransactionFees(transactionHash, walletAddress);
      console.log('(1)Transação enviada:', result);

      // Aguardar 10 segundos antes de atualizar o saldo
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      // Tentar obter taxas reais
      let fees = estimatedFees;
      try {
        fees = await tonService.getTransactionFees(result.hash, currentWallet);
        //const hashResult = await tonService.getHashsAudited(result.hash, currentWallet);
        //console.log('Hash de envio: ', hashResult);
        console.log('Taxas reais obtidas:', fees);
      } catch (feeError) {
        console.warn('Falha ao obter taxas reais, usando estimativa:', feeError);
      }

      // Atualizar saldo com retries
      const updated = await updateBalance();
      const hashResult = await tonService.getHashsAudited(currentWallet);
      console.log('Serial Hash: ', hashResult);
      const transactionLink = result.hash ? `<a href="https://testnet.tonscan.org/tx/${encodeURIComponent(hashResult)}" target="_blank" rel="noopener noreferrer">Ver detalhes</a>` : 'Hash inválido - verifique manualmente.';
      
      if (updated) {
        operationMessage.innerHTML = `Status: Transação concluída com sucesso! ${transactionLink}`;
        senderAddressElement.textContent = `Endereço da Carteira: ${currentWallet || 'Desconhecido'}`;
        recipientAddressElement.textContent = `Endereço de Recebimento: ${recipientAddress}`;
        transferredAmountElement.textContent = `Valor Transferido: ${amount.toFixed(9)} TON`;
        networkFeeElement.textContent = `Taxa de Rede: ${fees} TON`;
        hashElement.textContent = `Hash: ${hashResult}`;
        networkElement.textContent = `Rede: ${result.network}`;
        console.log('Transação concluída e saldo atualizado:', result, 'Taxas:', fees);
      } else {
        operationMessage.innerHTML = `Status: Transação enviada, mas falha ao atualizar saldo. ${transactionLink}`;
        senderAddressElement.textContent = `Endereço da Carteira: ${currentWallet || 'Desconhecido'}`;
        recipientAddressElement.textContent = `Endereço de Recebimento: ${recipientAddress}`;
        transferredAmountElement.textContent = `Valor Transferido: ${amount.toFixed(9)} TON`;
        networkFeeElement.textContent = `Taxa de Rede: ${fees} TON`;
        hashElement.textContent = `Hash: ${hashResult}`;
        networkElement.textContent = `Rede: ${result.network}`;
        console.log('Transação concluída, mas saldo não atualizado:', result, 'Taxas:', fees);
      }
    } catch (error) {
      console.error('Erro na transação:', error);
      operationMessage.textContent = `Status: Erro - ${error.message || 'Falha na transação. Tente novamente.'}`;
      senderAddressElement.textContent = `Endereço da Carteira: ${currentWallet || authenticatedWallet || 'Desconhecido'}`;
      recipientAddressElement.textContent = `Endereço de Recebimento: ${recipientAddress || '-'}`;
      transferredAmountElement.textContent = `Valor Transferido: ${amount ? amount.toFixed(9) : '-'}`;
      networkFeeElement.textContent = 'Taxa de Rede: -';
      hashElement.textContent = 'Hash: -';
      networkElement.textContent = 'Rede: -';
    }
  });

  backBtn.addEventListener('click', async () => {
    operationMessage.textContent = 'Status: Encerrando sessão...';
    try {
      await endSession();
      console.log('Redirecionando para index.html após encerramento da sessão');
      window.location.href = 'index.html';
    } catch (error) {
      console.log('Redirecionamento cancelado devido a erro na desconexão');
    }
  });
});