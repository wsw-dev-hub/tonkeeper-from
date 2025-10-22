import { TonConnectUI } from '@tonconnect/ui';

export class TonService {
  constructor() {
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

  // Verifica conexão com retries
  async checkConnection(maxRetries = 3, retryDelay = 4000, timeoutPerAttempt = 9000) {
    console.log('Iniciando verificação de conexão com a carteira');
    await new Promise(resolve => setTimeout(resolve, 6000));
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (this.tonConnectUI.connected && this.tonConnectUI.account) {
      console.log('Endereço retornado:', this.tonConnectUI.account?.address);
      return this.tonConnectUI.account?.address || 'Desconhecido';
    }
    console.warn('Nenhuma carteira conectada');
    return null;
  }

  // Obtém o saldo da carteira
  async getBalance() {
    console.log('Obtendo saldo da carteira');
    try {
      if (!this.tonConnectUI.connected || !this.tonConnectUI.account) {
        throw new Error('Nenhuma carteira conectada');
      }
      const address = this.tonConnectUI.account.address;
      console.log('Consultando saldo para endereço:', address);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`https://testnet.tonapi.io/v2/accounts/${address}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Falha ao obter saldo: ${response.statusText} (Status: ${response.status})`);
      }
      const data = await response.json();
      console.log('Resposta da API:', data);
      const balanceNanoTON = data.balance;
      const balanceTON = balanceNanoTON / 1e9; // Converter de nanoTON para TON
      console.log('Saldo obtido:', balanceTON, 'TON');
      return balanceTON.toFixed(4); // Retorna com 4 casas decimais
    } catch (error) {
      console.error('Erro ao obter saldo:', error);
      throw new Error(`Falha ao obter saldo: ${error.message}`);
    }
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
      await new Promise(resolve => setTimeout(resolve, 4000));
      if (!this.tonConnectUI.connected || !this.tonConnectUI.account) {
        throw new Error('Falha ao detectar carteira após conexão');
      }
      console.log('Carteira conectada:', this.tonConnectUI.account?.address);
      return this.tonConnectUI.account?.address || 'Desconhecido';
    } catch (error) {
      console.error('Erro ao conectar a carteira:', error);
      throw error;
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
      sessionStorage.removeItem('ton-connect-storage_bridge-connection');
      sessionStorage.removeItem('ton-connect-storage_protocol-version');
      console.log('sessionStorage do TON Connect limpo');
      if (this.tonConnectUI.connectionRestored) {
        console.log('Forçando restauração de estado do TON Connect');
        this.tonConnectUI.connectionRestored = false;
      }
    } catch (error) {
      if (error.message.includes('_WalletNotConnectedError')) {
        console.log('Ignorando _WalletNotConnectedError, nenhuma carteira conectada');
        sessionStorage.removeItem('ton-connect-storage_bridge-connection');
        sessionStorage.removeItem('ton-connect-storage_protocol-version');
        console.log('sessionStorage do TON Connect limpo após erro');
        return;
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
          amount: (parseFloat(amount) * 1e9).toString() // Converter TON para nanoTON
        }
      ]
    };
    const result = await this.tonConnectUI.sendTransaction(transaction);
    console.log('Transação enviada:', result);
    return {
      hash: result.boc,
      address,
      amount: parseFloat(amount).toFixed(4), // Retornar valor em TON
      network: 'Testnet'
    };
  }
}