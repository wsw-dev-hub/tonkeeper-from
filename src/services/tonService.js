import { TonConnectUI } from '@tonconnect/ui';
import { toUserFriendlyAddress } from "@tonconnect/sdk";

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
          console.log('Conexão detectada:', toUserFriendlyAddress(this.tonConnectUI.account.address, true));
          return {
            connected: true,
            address: toUserFriendlyAddress(this.tonConnectUI.account.address, true) // Retorna endereço raw
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

  // Obtém o endereço atual da carteira com retries
  async getCurrentWalletAddress(maxRetries = 5, retryDelay = 1000) {
    console.log('Obtendo endereço atual da carteira');
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (this.tonConnectUI.connected && this.tonConnectUI.account) {
          console.log('Endereço retornado:', this.tonConnectUI.account.address);
          const friendly = toUserFriendlyAddress(this.tonConnectUI.account.address, true); // true = testnet
          return friendly; // Retorna endereço raw
        }
        throw new Error('Nenhuma carteira conectada');
      } catch (error) {
        console.warn(`Tentativa ${attempt} de obter endereço falhou: ${error.message}`);
        if (attempt === maxRetries) {
          console.error('Erro ao obter endereço da carteira após retries:', error);
          return 'Desconhecido';
        }
        console.log(`Aguardando ${retryDelay}ms antes da próxima tentativa`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Obtém o saldo da carteira
  async getBalance() {
    console.log('Obtendo saldo da carteira');
    try {
      if (!this.tonConnectUI.connected || !this.tonConnectUI.account) {
        throw new Error('Nenhuma carteira conectada');
      }
      const address = toUserFriendlyAddress(this.tonConnectUI.account.address, true);
      console.log('Consultando saldo para endereço:', address);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout aumentado
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
      const balanceTON = balanceNanoTON / 1e9;
      console.log('Saldo obtido:', balanceTON, 'TON');
      return balanceTON.toFixed(6);
    } catch (error) {
      console.error('Erro ao obter saldo:', error);
      throw new Error(`Falha ao obter saldo: ${error.message}`);
    }
  }

  // Obtém taxas da transação
  async getTransactionFees(transactionHash, walletAddress) {
    console.log('Obtendo taxas para transação:', transactionHash,);
    console.log('Obtendo endereço da wallet para transação:', walletAddress);
    try {
      /*const endpoint = `https://testnet.toncenter.com/api/v2/getTransactions?address=${walletAddress}&limit=1`;
      console.log('Verificando retorno do endpoint: ', endpoint);

      const respon = await fetch(endpoint);
      const dt = await respon.json();

      if (dt.ok && dt.result.length > 0) {
        const tx = dt.result[0];
        const hash = tx.transaction_id?.hash;
        const lt = tx.transaction_id?.lt;
        const fee = tx.fees ? (parseInt(tx.fees.total_fees) / 1e9).toFixed(9) : "0";

        console.log(`Total fees:  ${dt.result[0].fee / 1e9}`);

        console.log("Última transação:");
        console.log(`→ Hash: ${hash}`);
        console.log(`→ LT: ${lt}`);
        console.log(`→ Valor: ${(parseInt(tx.in_msg.value) / 1e9).toFixed(9)} TON`);
        console.log(`→ Fee: ${fee} TON`);
      }*/

      //const response = await fetch(`https://testnet.tonapi.io/v2/blockchain/transactions/${transactionHash}`, {
      const response = await fetch(`https://testnet.toncenter.com/api/v2/getTransactions?address=${walletAddress}&limit=1`, {
        signal: new AbortController().signal
      });
      if (!response.ok) {
        throw new Error(`Falha ao obter detalhes da transação: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Detalhes da transação:', data);
      const feesNanoTON = data.fee || 10000000; // Fallback: 0.01 TON em nanoTON
      const feesTON = feesNanoTON / 1e9;
      //const feesTON = dt.result[0].fee / 1e9;
      console.log('Taxas obtidas:', feesTON, 'TON');
      return feesTON.toFixed(9);
    } catch (error) {
      console.warn('Erro ao obter taxas, usando estimativa de 0.01 TON:', error);
      return (0.01).toFixed(6);
    }
  }
  // Retorna o link auditável do Hash da Transação
  async getHashsAudited(walletAddress){
    try{
      const response = await fetch(`https://testnet.toncenter.com/api/v2/getTransactions?address=${walletAddress}&limit=1`, {
              signal: new AbortController().signal
            });
      if (!response.ok) {
        throw new Error(`Falha ao obter o hash da transação: ${response.statusText}`);
      }
        const data = await response.json();
        const auditHash =  data.result[0].in_msg.hash;
        console.log('Hash auditável: ', auditHash);
        return auditHash;
      } catch (error) {
        console.warn('Erro ao obter o Hash válido da tansação:', error);
        return error;
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
      console.log('Carteira conectada:', toUserFriendlyAddress(this.tonConnectUI.account.address, true));
      return toUserFriendlyAddress(this.tonConnectUI.account.address, true); // Retorna endereço raw
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
    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address,
            amount: (parseFloat(amount) * 1e9).toString() // Converter TON para nanoTON
          }
        ]
      };
      console.log('Transação preparada:', transaction);
      const result = await this.tonConnectUI.sendTransaction(transaction);
      console.log('Resultado bruto da transação:', result);
      return {
        hash: result.boc,
        address,
        amount: parseFloat(amount).toFixed(4),
        network: 'Testnet'
      };
    } catch (error) {
      console.error('Erro ao enviar transação:', error);
      throw error;
    }
  }
}