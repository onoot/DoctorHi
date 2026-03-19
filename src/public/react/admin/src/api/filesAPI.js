import { http } from './http';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Получить URL файла
 * @param {string} path - Путь к файлу
 * @returns {string}
 */
export function getFileUrl(path) {
  if (!path) return '';
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  let cleanPath = path.startsWith('/uploads') ? path.substring(1) : path;
  
  if (!cleanPath.startsWith('uploads/')) {
    cleanPath = `uploads/${cleanPath}`;
  }
  
  return `${API_BASE_URL}/${cleanPath}`;
}

/**
 * Получить URL превью для изображения
 * @param {string} path - Путь к файлу
 * @returns {string|null}
 */
export function getThumbnailUrl(path) {
  const url = getFileUrl(path);
  
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(path);
  
  return isImage ? url : null;
}

/**
 * Загрузить файл для транзакции
 * @param {string|number} transactionId - ID транзакции
 * @param {string} category - Категория файла
 * @param {File} file - Файл для загрузки
 * @returns {Promise<Object>}
 */
export async function uploadFile(transactionId, category, file) {
  if (!transactionId) throw new Error('Transaction ID is required');
  if (!category) throw new Error('Category is required');
  if (!file) throw new Error('File is required');
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  
  const response = await http.post(`/v1/admin/transactions/${transactionId}/files`, formData);
  
  if (response.success) {
    return response;
  }
  
  throw new Error(response.message || 'Failed to upload file');
}

/**
 * Удалить файл
 * @param {string|number} transactionId - ID транзакции
 * @param {string|number} fileId - ID файла
 * @returns {Promise<Object>}
 */
export async function deleteFile(transactionId, fileId) {
  if (!transactionId) throw new Error('Transaction ID is required');
  if (!fileId) throw new Error('File ID is required');
  
  const response = await http.del(`/v1/admin/transactions/${transactionId}/files/${fileId}`);
  
  if (response.success) {
    return response;
  }
  
  throw new Error(response.message || 'Failed to delete file');
}

/**
 * Получить все файлы транзакции
 * @param {string|number} transactionId - ID транзакции
 * @returns {Promise<Array>}
 */
export async function getTransactionFiles(transactionId) {
  if (!transactionId) throw new Error('Transaction ID is required');
  
  const response = await http.get(`/v1/admin/transactions/${transactionId}/files`);
  
  if (response.success) {
    return response.files || [];
  }
  
  throw new Error(response.message || 'Failed to load files');
}

export default {
  getFileUrl,
  getThumbnailUrl,
  uploadFile,
  deleteFile,
  getTransactionFiles
};