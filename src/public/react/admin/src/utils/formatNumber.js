// src/utils/formatNumber.js
export function formatPKR(amount) {
  if (amount == null || amount === '') return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount));
}

export function parseFormattedNumber(value) {
  if (!value) return 0;
  const clean = value.replace(/[^\d.]/g, '');
  return parseFloat(clean) || 0;
}