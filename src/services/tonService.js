import { TonConnectUI } from '@tonconnect/ui';

export class TonService {
  constructor() {
    // Limpar sessionStorage relacionado ao TON Connect
    try {
      sessionStorage.removeItem('ton-connect-storage_bridge-connection');
      sessionStorage.removeItem('ton-connect-storage_protocol-version');
      console.log('sessionStorage limpo para TON Connect');
    } catch (error) {
      console.warn('Erro ao limpar sessionStorage:', error);
    }

    try {
      this.tonConnectUI = new TonConnectUI({
        manifestUrl: 'https://wsw-dev-hub.github.io/tonkeeper-from/public/tonconnect-manifest.json',
        network: 'testnet'
      });
      console.log('TonConnectUI inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar TonConnectUI:', error);
      throw new Error('Falha na inicialização do TON Connect SDK');
    }
  }

  // Verifica conexão com retries (usado apenas para verificação de cache)
  async checkConnection(maxRetries = 3, retryDelay = 4000, timeoutPerAttempt = 9000) {
    console.log('Iniciando verificação de conexão com a carteira');
    
    // Aguarda inicialização do SDK
    await new Promise(resolve => setTimeout(resolve, 6000)); // 6s

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt} de verificação de conexão`);
        if (this.tonConnectUI.account && this.tonConnectUI.connected) {
          console.log('Conexão detectada:', this.tonConnectUI.account?.address);
          return {
            connected: true,
            address: this.tonConnectUI.account?.address || 'Desconhecido'
          };
        }
        throw new Error('Nenhuma carteira conectada');
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

  // Obtém o endereço atual da carteira
  async getCurrentWalletAddress() {
    console.log('Obtendo endereço atual da carteira');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguarda inicialização
    if (this.tonConnectUI.connected && this.tonConnectUI.account) {
      return this.tonConnectUI.account?.address || 'Desconhecido';
    }
    return null;
  }

  // Conecta a carteira
  async connectWallet() {
    console.log('Iniciando conexão com a carteira');
    try {
      if (!this.tonConnectUI) {
        throw new Error('TonConnectUI não inicializado');
      }
      console.log('Chamando tonConnectUI.connectWallet()');
      await this.tonConnectUI.connectWallet();
      // Aguarda atualização do estado do SDK
      await new Promise(resolve => setTimeout(resolve, 4000)); // Aumentado para 4s
      if (!this.tonConnectUI.connected || !this.tonConnectUI.account) {
        throw new Error('Falha ao detectar carteira após conexão');
      }
      console.log('Carteira conectada:', this.tonConnectUI.account?.address);
      return this.tonConnectUI.account?.address || 'Desconhecido';
    } catch (error) {
      console.error('Erro ao conectar a carteira:', error);
      throw error; // Propagar erro original
    }
  }

  // Desconecta a carteira
  async disconnectWallet() {
    console.log('Desconectando carteira');
    try {
      if (this.tonConnectUI.connected) {
        await this.tonConnectUI.disconnect();
        console.log('Carteira desconectada');
      } else {
        console.log('Nenhuma carteira conectada para desconectar');
      }
      // Limpar sessionStorage relacionado ao TON Connect
      sessionStorage.removeItem('ton-connect-storage_bridge-connection');
      sessionStorage.removeItem('ton-connect-storage_protocol-version');
      console.log('sessionStorage do TON Connect limpo');
      // Limpeza adicional de estado interno
      if (this.tonConnectUI.connectionRestored) {
        console.log('Forçando restauração de estado do TON Connect');
        this.tonConnectUI.connectionRestored = false;
      }
    } catch (error) {
      if (error.message.includes('_WalletNotConnectedError')) {
        console.log('Ignorando _WalletNotConnectedError, nenhuma carteira conectada');
        // Limpar sessionStorage mesmo assim
        sessionStorage.removeItem('ton-connect-storage_bridge-connection');
        sessionStorage.removeItem('ton-connect-storage_protocol-version');
        console.log('sessionStorage do TON Connect limpo após erro');
        return; // Não propagar o erro
      }
      console.error('Erro ao desconectar carteira:', error);
      throw new Error('Falha ao desconectar a carteira');
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