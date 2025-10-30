import fetch from "node-fetch";
import { TonService } from '../services/tonService.js';
import { PriceService } from '../services/priceService.js';

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
  const atualizarBtn = document.getElementById('atualizarBtn');

});

atualizarBtn.addEventListener('click', async () => {
    const priceService = new PriceService();
    console.log('Valores das moedas: ',await priceService.getTonPrices());

});
