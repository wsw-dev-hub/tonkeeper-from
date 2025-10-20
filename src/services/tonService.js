import { TonConnectUI } from '@tonconnect/ui';

export class TonService {
  constructor() {
    // Limpar localStorage para evitar sessões corrompidas
    try {
      localStorage.removeItem('ton-connect-storage_bridge-connection');
      localStorage.removeItem('ton-connect-storage_protocol-version');
      console.log('LocalStorage limpo para TON Connect');
    } catch (error) {
      console.warn('Erro ao limpar localStorage:', error);
    }

    this.tonConnectUI = new TonConnectUI({
      manifestUrl: 'https://wsw-dev-hub.github.io/tonkeeper-from/public/tonconnect-manifest.json',
      network: 'testnet'
    });
    console.log('TonConnectUI inicializado');
  }

  // Verifica conexão com retries
  async checkConnection(maxRetries = 4, retryDelay = 2000, timeoutPerAttempt = 12000) {
    console.log('Iniciando verificação de conexão com a carteira');
    
    // Aguarda inicialização do SDK
    await new Promise(resolve => setTimeout(resolve, 2000));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt} de verificação de conexão`);
        return await new Promise((resolve, reject) => {
          // Verifica diretamente tonConnectUI.connected
          if (this.tonConnectUI.connected) {
            console.log('Conexão detectada diretamente:', this.tonConnectUI.account?.address);
            resolve({
              connected: true,
              address: this.tonConnectUI.account?.address || 'Desconhecido'
            });
            return;
          }

          // Fallback com onStatusChange
          const unsubscribe = this.tonConnectUI.onStatusChange(
            (walletInfo) => {
              console.log('onStatusChange disparado:', walletInfo);
              if (walletInfo) {
                resolve({
                  connected: true,
                  address: walletInfo.account?.address || 'Desconhecido'
                });
                unsubscribe();
              } else {
                reject(new Error('Nenhuma carteira conectada'));
              }
            },
            (error) => {
              console.error('Erro em onStatusChange:', error);
              reject(error);
              unsubscribe();
            }
          );

          // Timeout por tentativa
          setTimeout(() => {
            reject(new Error('Timeout na verificação da conexão'));
            unsubscribe();
          }, timeoutPerAttempt);
        });
      } catch (error) {
        console.warn(`Tentativa ${attempt} falhou: ${error.message}`);
        if (attempt === maxRetries) {
          throw new Error(`Falha após ${maxRetries} tentativas: ${error.message}`);
        }
        console.log(`Aguardando ${retryDelay}ms antes da próxima tentativa`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Conecta a carteira
  async connectWallet() {
    console.log('Iniciando conexão com a carteira');
    try {
      await this.tonConnectUI.connectWallet();
      console.log('Carteira conectada:', this.tonConnectUI.account?.address);
      return this.tonConnectUI.account?.address || 'Desconhecido';
    } catch (error) {
      console.error('Erro ao conectar a carteira:', error);
      throw new Error('Falha ao conectar a carteira');
    }
  }

  // Valida endereço TON
  validateAddress(address) {
    console.log('Validando endereço:', address);
    const validPrefixes = ['EQ', 'UQ', '0Q', 'kQ'];
    const isValidPrefix = validPrefixes.some(prefix => address.startsWith(prefix));
    const isValidLength = address.length === 48;
    const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(address);
    const isValid = isValidPrefix && isValidLength && isValidBase64;
    console.log('Resultado da validação:', isValid);
    return isValid;
  }

  // Envia transação
  async sendTransaction(address, amount) {
    console.log('Enviando transação para:', address, 'Valor:', amount);
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          address,
          amount: (parseFloat(amount) * 1e9).toString()
        }
      ]
    };
    const result = await this.tonConnectUI.sendTransaction(transaction);
    console.log('Transação enviada:', result);
    return {
      hash: result.boc,
      address,
      amount,
      network: 'Testnet'
    };
  }
}