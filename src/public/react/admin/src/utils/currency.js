// src/utils/currency.js
import { http } from '../api/http';

let fallbackRate = 0.0036;

export async function getExchangeRate() {
  try {
    const data = await http.get('/v1/admin/latest/PKR');
    if (data.success && data.USD) {
      return data.USD;
    }
  } catch (e) {
    console.warn('Failed to fetch exchange rate, using fallback');
  }
  return fallbackRate;
}

export async function convertPKRToUSD(pkrAmount) {
  const rate = await getExchangeRate();
  return pkrAmount * rate;
}

export function formatUSD(usdAmount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usdAmount);
}