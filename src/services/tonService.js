import { TonConnectUI } from '@tonconnect/ui';

export class TonService {
  constructor() {
    this.tonConnectUI = new TonConnectUI({
      manifestUrl: 'https://wsw-dev-hub.github.io/tonkeeper-from/tonconnect-manifest.json',
      network: 'testnet'
    });
  }

  // Verifica conexão com a carteira de forma assíncrona
  async checkConnection() {
    return new Promise((resolve, reject) => {
      this.tonConnectUI.onStatusChange(
        (walletInfo) => {
          if (walletInfo) {
            resolve({
              connected: true,
              address: walletInfo.account?.address || 'Desconhecido'
            });
          } else {
            reject(new Error('Nenhuma carteira conectada'));
          }
        },
        (error) => reject(error)
      );
      setTimeout(() => reject(new Error('Timeout na verificação da conexão')), 5000);
    });
  }

  // Conecta a carteira
  async connectWallet() {
    if (this.tonConnectUI.connected) {
      return this.tonConnectUI.account?.address || 'Desconhecido';
    }
    await this.tonConnectUI.connectWallet();
    return this.tonConnectUI.account?.address || 'Desconhecido';
  }

  // Valida endereço TON
  validateAddress(address) {
    const validPrefixes = ['EQ', 'UQ', '0Q', 'kQ'];
    const isValidPrefix = validPrefixes.some(prefix => address.startsWith(prefix));
    const isValidLength = address.length === 48;
    const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(address);
    return isValidPrefix && isValidLength && isValidBase64;
  }

  // Envia transação
  async sendTransaction(address, amount) {
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
    return {
      hash: result.boc,
      address,
      amount,
      network: 'Testnet'
    };
  }
}