import { PriceService } from '../services/priceService.js';

async function carregarCotacao() {
  const box = document.getElementById("cotacao");
  box.innerHTML = "<p>⏳ Carregando cotação...</p>";
  const priceService = new PriceService();

  try {
    //const resp = await fetch("/api/price");
    const resp = await priceService.getTonPrices();
    const data = await resp.json();
    console.log('Valores Ton Price: ', resp);
    box.innerHTML = `
      <h3>Rede: ${data.network}</h3>
      <p><b>1 TON ≈ ${data.ton_to_usd.toFixed(2)} USD</b></p>
      <p><b>1 USD ≈ ${data.usd_to_brl.toFixed(2)} BRL</b></p>
      <p><b>1 TON ≈ ${data.ton_to_brl.toFixed(2)} BRL</b></p>
      <p>🕒 Atualizado em: ${data.updated_at}</p>
    `;
  } catch (err) {
    box.innerHTML = "<p style='color:red'>Erro ao carregar cotação.</p>";
    console.error(err);
  }
}

//document.getElementById("atualizar").addEventListener("click", carregarCotacao);
carregarCotacao();
