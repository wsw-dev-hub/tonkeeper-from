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

  // Verifica conexão com delay para garantir inicialização
  async checkConnection() {
    console.log('Verificando conexão com a carteira');
    // Aguarda inicialização do SDK
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (this.tonConnectUI.connected) {
      console.log('Conexão confirmada:', this.tonConnectUI.account?.address);
      return {
        connected: true,
        address: this.tonConnectUI.account?.address || 'Desconhecido'
      };
    }
    throw new Error('Nenhuma carteira conectada');
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