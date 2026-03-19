// src/utils/validateCNIC.js
export function validateCNIC(cnic) {
  if (!cnic) return 'CNIC is required';
  const regex = /^\d{5}-\d{7}-\d$/;
  return regex.test(cnic) ? null : 'Invalid CNIC format (e.g. 12345-1234567-1)';
}