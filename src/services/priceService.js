// src/services/priceService.js
export class PriceService {
  constructor() {
    this.api = 'https://api.coingecko.com/api/v3/simple/price';
    this.cache = new Map();
    this.cacheTime = 30000; // 30 segundos
  }

  // Busca múltiplas moedas de uma vez
  async getPrices(coins = [], vs = 'usd') {
    if (!Array.isArray(coins) || coins.length === 0) return {};

    const ids = coins.map(c => c.id).join(',');
    const cacheKey = `${ids}_${vs}`;
    const now = Date.now();

    // Cache
    if (this.cache.has(cacheKey) && now - this.cache.get(cacheKey).timestamp < this.cacheTime) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await fetch(`${this.api}?ids=${ids}&vs_currencies=${vs}`);
      if (!response.ok) throw new Error('API indisponível');

      const data = await response.json();
      const result = {};

      coins.forEach(coin => {
        const value = data[coin.id]?.[vs] ?? null;
        result[coin.symbol] = {
          name: coin.name,
          price: value,
          formatted: value ? `$${value.toFixed(coin.decimals ?? 4)}` : 'N/A'
        };
      });

      // Atualiza cache
      this.cache.set(cacheKey, { data: result, timestamp: now });
      return result;
    } catch (error) {
      console.warn('Erro ao buscar preços:', error);
      return {};
    }
  }

  // Busca uma única moeda
  async getPrice(id, symbol, name, vs = 'usd', decimals = 4) {
    const prices = await this.getPrices([{ id, symbol, name, decimals }], vs);
    return prices[symbol] || null;
  }
}