import { http } from './http';

/**
 * Получить платеж по ID
 * @param {string|number} transactionId - ID транзакции
 * @param {string|number} paymentId - ID платежа
 * @returns {Promise<Object>}
 */
export async function getPaymentById(transactionId, paymentId) {
  if (!transactionId) throw new Error('Transaction ID is required');
  if (!paymentId) throw new Error('Payment ID is required');
  
  const response = await http.get(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`);
  
  if (response.success && response.payment) {
    return response.payment;
  }
  
  throw new Error(response.message || 'Failed to load payment');
}

/**
 * Обновить платеж
 * @param {string|number} transactionId - ID транзакции
 * @param {string|number} paymentId - ID платежа
 * @param {Object} paymentData - Данные для обновления
 * @param {FormData} [receiptFile] - Файл квитанции (опционально)
 * @returns {Promise<Object>}
 */
export async function updatePayment(transactionId, paymentId, paymentData, receiptFile = null) {
  if (!transactionId) throw new Error('Transaction ID is required');
  if (!paymentId) throw new Error('Payment ID is required');
  
  let body;
  let headers = {};
  
  if (receiptFile instanceof File) {
    // Если есть файл - используем FormData
    body = new FormData();
    body.append('receipt', receiptFile);
    body.append('data', JSON.stringify(paymentData));
  } else {
    // Если нет файла - отправляем JSON
    body = paymentData;
    headers = { 'Content-Type': 'application/json' };
  }
  
  const response = await http.put(
    `/v1/admin/transactions/${transactionId}/payments/${paymentId}`,
    body,
    headers
  );
  
  if (response.success) {
    return response.payment || response;
  }
  
  throw new Error(response.message || 'Failed to update payment');
}

/**
 * Получить все платежи транзакции
 * @param {string|number} transactionId - ID транзакции
 * @returns {Promise<Array>}
 */
export async function getTransactionPayments(transactionId) {
  if (!transactionId) throw new Error('Transaction ID is required');
  
  const response = await http.get(`/v1/admin/transactions/${transactionId}/payments`);
  
  if (response.success) {
    return response.payments || [];
  }
  
  throw new Error(response.message || 'Failed to load payments');
}

/**
 * Создать новый платеж
 * @param {string|number} transactionId - ID транзакции
 * @param {Object} paymentData - Данные платежа
 * @param {File} [receiptFile] - Файл квитанции (опционально)
 * @returns {Promise<Object>}
 */
export async function createPayment(transactionId, paymentData, receiptFile = null) {
  if (!transactionId) throw new Error('Transaction ID is required');
  
  let body;
  let headers = {};
  
  if (receiptFile instanceof File) {
    body = new FormData();
    body.append('receipt', receiptFile);
    body.append('data', JSON.stringify(paymentData));
  } else {
    body = paymentData;
    headers = { 'Content-Type': 'application/json' };
  }
  
  const response = await http.post(
    `/v1/admin/transactions/${transactionId}/payments`,
    body,
    headers
  );
  
  if (response.success) {
    return response.payment || response;
  }
  
  throw new Error(response.message || 'Failed to create payment');
}

/**
 * Удалить платеж
 * @param {string|number} transactionId - ID транзакции
 * @param {string|number} paymentId - ID платежа
 * @returns {Promise<Object>}
 */
export async function deletePayment(transactionId, paymentId) {
  if (!transactionId) throw new Error('Transaction ID is required');
  if (!paymentId) throw new Error('Payment ID is required');
  
  const response = await http.del(`/v1/admin/transactions/${transactionId}/payments/${paymentId}`);
  
  if (response.success) {
    return response;
  }
  
  throw new Error(response.message || 'Failed to delete payment');
}

// Экспортируем все методы по умолчанию
export default {
  getPaymentById,
  updatePayment,
  getTransactionPayments,
  createPayment,
  deletePayment
};