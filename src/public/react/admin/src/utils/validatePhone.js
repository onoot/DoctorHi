// src/utils/validatePhone.js
export function validatePhone(phone) {
  if (!phone) return 'Phone is required';
  const regex = /^\+92\d{10}$/;
  return regex.test(phone) ? null : 'Invalid phone (e.g. +923001234567)';
}