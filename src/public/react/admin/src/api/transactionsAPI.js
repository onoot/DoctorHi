import { http } from './http';

/**
 * Получить транзакцию по ID
 * @param {string|number} transactionId - ID транзакции
 * @returns {Promise<Object>}
 */
export async function getTransactionById(transactionId) {
  if (!transactionId) throw new Error('Transaction ID is required');
  
  const response = await http.get(`/v1/admin/transactions/${transactionId}`);
  
  if (response.success) {
    return response;
  }
  
  throw new Error(response.message || 'Failed to load transaction');
}

/**
 * Обновить транзакцию
 * @param {string|number} transactionId - ID транзакции
 * @param {Object} transactionData - Данные для обновления
 * @returns {Promise<Object>}
 */
export async function updateTransaction(transactionId, transactionData) {
  if (!transactionId) throw new Error('Transaction ID is required');
  
  const response = await http.put(`/v1/admin/transactions/${transactionId}`, transactionData);
  
  if (response.success) {
    return response;
  }
  
  throw new Error(response.message || 'Failed to update transaction');
}

/**
 * Получить все транзакции
 * @param {Object} params - Параметры фильтрации
 * @returns {Promise<Array>}
 */
export async function getAllTransactions(params = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  if (params.page) qs.set('page', params.page);
  if (params.limit) qs.set('limit', params.limit);
  
  const response = await http.get(`/v1/admin/transactions${qs.toString() ? `?${qs.toString()}` : ''}`);
  
  if (response.success) {
    return response.transactions || [];
  }
  
  throw new Error(response.message || 'Failed to load transactions');
}

/**
 * Создать новую транзакцию
 * @param {Object} transactionData - Данные транзакции
 * @returns {Promise<Object>}
 */
export async function createTransaction(transactionData) {
  const response = await http.post('/v1/admin/transactions', transactionData);
  
  if (response.success) {
    return response.transaction || response;
  }
  
  throw new Error(response.message || 'Failed to create transaction');
}

/**
 * Удалить транзакцию
 * @param {string|number} transactionId - ID транзакции
 * @returns {Promise<Object>}
 */
export async function deleteTransaction(transactionId) {
  if (!transactionId) throw new Error('Transaction ID is required');
  
  const response = await http.del(`/v1/admin/transactions/${transactionId}`);
  
  if (response.success) {
    return response;
  }
  
  throw new Error(response.message || 'Failed to delete transaction');
}

export default {
  getTransactionById,
  updateTransaction,
  getAllTransactions,
  createTransaction,
  deleteTransaction
};