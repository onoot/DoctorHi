// src/api/PropertyAPI.js
import { http } from './http';

/**
 * Получить все объекты недвижимости
 * @returns {Promise<Object>}
 */
export async function getAllProperties() {
  const response = await http.get('/v1/admin/properties');
  if (response.success) {
    return response.properties || [];
  } else {
    throw new Error(response.message || 'Failed to load properties');
  }
}

/**
 * Получить объект недвижимости по ID
 * @param {string} id - ID объекта
 * @returns {Promise<Object>}
 */
export async function getPropertyById(id) {
  if (!id) throw new Error('Property ID is required');
  const response = await http.get(`/v1/admin/properties/${id}`);
  if (response.success) {
    return response.property || null;
  } else {
    throw new Error(response.message || 'Failed to load property');
  }
}

/**
 * Создать новый объект недвижимости
 * @param {Object} propertyData - Данные объекта {id, name, type, category, area}
 * @returns {Promise<Object>}
 */
export async function createProperty(propertyData) {
  if (!propertyData || !propertyData.id || !propertyData.name || !propertyData.type || !propertyData.category) {
    throw new Error('ID, name, type, and category are required');
  }
  const response = await http.post('/v1/admin/properties', propertyData);
  if (response.success) {
    return response.property;
  } else {
    throw new Error(response.message || 'Failed to create property');
  }
}

/**
 * Обновить объект недвижимости
 * @param {string} id - ID объекта
 * @param {Object} propertyData - Данные объекта {name, type, category, area}
 * @returns {Promise<Object>}
 */
export async function updateProperty(id, propertyData) {
  if (!id) throw new Error('Property ID is required');
  if (!propertyData || Object.keys(propertyData).length === 0) {
    throw new Error('Property data is required');
  }
  const response = await http.put(`/v1/admin/properties/${id}`, propertyData);
  if (response.success) {
    return response.property;
  } else {
    throw new Error(response.message || 'Failed to update property');
  }
}

/**
 * Удалить объект недвижимости
 * @param {string} id - ID объекта
 * @returns {Promise<Object>}
 */
export async function deleteProperty(id) {
  if (!id) throw new Error('Property ID is required');
  const response = await http.del(`/v1/admin/properties/${id}`);
  if (response.success) {
    return response;
  } else {
    throw new Error(response.message || 'Failed to delete property');
  }
}