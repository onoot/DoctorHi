// src/utils/payment.js
export function calculateRemaining(total, paid) {
  return parseFloat(total) - parseFloat(paid);
}