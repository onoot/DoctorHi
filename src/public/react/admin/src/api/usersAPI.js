// src/api/usersAPI.js
import { http } from './http';

/**
 * Получить список всех пользователей
 * @param {Object} params - Параметры фильтрации
 * @returns {Promise<Array>}
 */
export async function getAllUsers(params = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  if (params.page) qs.set('page', params.page);
  if (params.limit) qs.set('limit', params.limit);
  if (params.property_id) qs.set('property_id', params.property_id);
  
  const response = await http.get(`/v1/admin/users${qs.toString() ? `?${qs.toString()}` : ''}`);
  
  if (response.success) {
    return response.users || [];
  }
  
  throw new Error(response.message || 'Failed to load users');
}

/**
 * Получить пользователя по ID
 * @param {string|number} userId - ID пользователя
 * @returns {Promise<Object>}
 */
export async function getUserById(userId) {
  if (!userId) throw new Error('User ID is required');
  
  const response = await http.get(`/v1/admin/users/${userId}`);
  
  if (response.success) {
    return response.user || response;
  }
  
  throw new Error(response.message || 'Failed to load user');
}

/**
 * Создать нового пользователя
 * @param {Object} userData - Данные пользователя
 * @returns {Promise<Object>}
 */
export async function createUser(userData) {
  if (!userData) throw new Error('User data is required');
  
  const response = await http.post('/v1/admin/users', userData);
  
  if (response.success) {
    return response.user || response;
  }
  
  throw new Error(response.message || 'Failed to create user');
}

/**
 * Обновить пользователя
 * @param {string|number} userId - ID пользователя
 * @param {Object} userData - Данные для обновления
 * @returns {Promise<Object>}
 */
export async function updateUser(userId, userData) {
  if (!userId) throw new Error('User ID is required');
  
  const response = await http.put(`/v1/admin/users/${userId}`, userData);
  
  if (response.success) {
    return response.user || response;
  }
  
  throw new Error(response.message || 'Failed to update user');
}

/**
 * Обновить пароль пользователя
 * @param {string|number} userId - ID пользователя
 * @param {string} password - Новый пароль
 * @returns {Promise<Object>}
 */
export async function updateUserPassword(userId, password) {
  if (!userId) throw new Error('User ID is required');
  if (!password) throw new Error('Password is required');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');
  
  const response = await http.put(`/v1/admin/users/${userId}/password`, { password });
  
  if (response.success) {
    return response;
  }
  
  throw new Error(response.message || 'Failed to update password');
}

/**
 * Архивировать пользователя (мягкое удаление)
 * @param {string|number} userId - ID пользователя
 * @returns {Promise<Object>}
 */
export async function archiveUser(userId) {
  if (!userId) throw new Error('User ID is required');
  
  return updateUser(userId, { status: 'archived' });
}

/**
 * Активировать пользователя
 * @param {string|number} userId - ID пользователя
 * @returns {Promise<Object>}
 */
export async function activateUser(userId) {
  if (!userId) throw new Error('User ID is required');
  
  return updateUser(userId, { status: 'active' });
}

/**
 * Заблокировать пользователя
 * @param {string|number} userId - ID пользователя
 * @returns {Promise<Object>}
 */
export async function blockUser(userId) {
  if (!userId) throw new Error('User ID is required');
  
  return updateUser(userId, { status: 'blocked' });
}

/**
 * Получить единицы недвижимости пользователя
 * @param {string|number} userId - ID пользователя
 * @returns {Promise<Array>}
 */
export async function getUserUnits(userId) {
  if (!userId) throw new Error('User ID is required');
  
  const response = await http.get(`/v1/admin/users/${userId}/units`);
  
  if (response.success) {
    return response.units || [];
  }
  
  throw new Error(response.message || 'Failed to load user units');
}

/**
 * Назначить единицы пользователю
 * @param {string|number} userId - ID пользователя
 * @param {Array<string>} unitIds - Массив ID единиц
 * @returns {Promise<Object>}
 */
export async function assignUserUnits(userId, unitIds) {
  if (!userId) throw new Error('User ID is required');
  if (!Array.isArray(unitIds)) throw new Error('Unit IDs must be an array');
  
  const response = await http.post(`/v1/admin/users/${userId}/units`, { unit_ids: unitIds });
  
  if (response.success) {
    return response;
  }
  
  throw new Error(response.message || 'Failed to assign units');
}

/**
 * Сгенерировать логин и пароль
 * @returns {Object} - { login, password }
 */
export function generateCredentials() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const login = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  
  const passChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const password = Array.from({ length: 12 }, () => passChars[Math.floor(Math.random() * passChars.length)]).join('');
  
  return { login, password };
}

/**
 * Поиск пользователей по объектам
 * @param {string} propertyId - ID объекта
 * @returns {Promise<Array>}
 */
export async function getUsersByProperty(propertyId) {
  if (!propertyId) throw new Error('Property ID is required');
  
  const response = await http.get(`/v1/admin/properties/${propertyId}/users`);
  
  if (response.success) {
    return response.users || [];
  }
  
  throw new Error(response.message || 'Failed to load users by property');
}

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  archiveUser,
  activateUser,
  blockUser,
  getUserUnits,
  assignUserUnits,
  generateCredentials,
  getUsersByProperty
};