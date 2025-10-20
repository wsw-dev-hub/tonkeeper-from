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
      manifestUrl: 'https://wsw-dev-hub.github.io/tonkeeper-from/tonconnect-manifest.json',
      network: 'testnet'
    });
    console.log('TonConnectUI inicializado');
  }

  // Verifica conexão com retries e fallback
  async checkConnection(maxRetries = 3, retryDelay = 2000) {
    let attempts = 0;

    // Fallback: Verifica tonConnectUI.connected diretamente
    if (this.tonConnectUI.connected) {
      console.log('Conexão detectada diretamente via tonConnectUI.connected');
      return {
        connected: true,
        address: this.tonConnectUI.account?.address || 'Desconhecido'
      };
    }

    while (attempts < maxRetries) {
      try {
        console.log(`Tentativa ${attempts + 1} de verificação de conexão`);
        return await new Promise((resolve, reject) => {
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

          // Timeout de 15 segundos por tentativa
          setTimeout(() => {
            reject(new Error('Timeout na verificação da conexão'));
            unsubscribe();
          }, 15000);
        });
      } catch (error) {
        attempts++;
        console.warn(`Tentativa ${attempts} falhou: ${error.message}`);
        if (attempts >= maxRetries) {
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
    if (this.tonConnectUI.connected) {
      console.log('Carteira já conectada:', this.tonConnectUI.account?.address);
      return this.tonConnectUI.account?.address || 'Desconhecido';
    }
    await this.tonConnectUI.connectWallet();
    console.log('Carteira conectada:', this.tonConnectUI.account?.address);
    return this.tonConnectUI.account?.address || 'Desconhecido';
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