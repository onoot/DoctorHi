// public/js/property-api.js
// Обернем в IIFE для изоляции и избежания глобальных переменных внутри
(function(window) {
  'use strict';

  // Предполагается, что apiRequest определена глобально или будет импортирована другим способом
  // Если apiRequest не глобальна, её нужно определить здесь или импортировать,
  // например, через тег <script> перед этим файлом.

  /**
   * Получить все объекты недвижимости
   * @returns {Promise<Object>}
   */
  async function getAllProperties() {
      return await apiRequest('/api/v1/admin/units');
  }

  /**
   * Получить объект недвижимости по ID
   * @param {string} id - ID объекта
   * @returns {Promise<Object>}
   */
  async function getPropertyById(id) {
      if (!id) throw new Error('Property ID is required');
      return await apiRequest(`/api/v1/admin/units/${id}`);
  }

  /**
   * Создать новый объект недвижимости
   * @param {Object} propertyData - Данные объекта {id, name, type, category, area}
   * @returns {Promise<Object>}
   */
  async function createProperty(propertyData) {
      if (!propertyData || !propertyData.id || !propertyData.name || !propertyData.type || !propertyData.category) {
          throw new Error('ID, name, type, and category are required');
      }
      return await apiRequest('/api/v1/admin/units', {
          method: 'POST',
          body: JSON.stringify(propertyData)
      });
  }

  /**
   * Обновить объект недвижимости
   * @param {string} id - ID объекта
   * @param {Object} propertyData - Данные объекта {name, type, category, area}
   * @returns {Promise<Object>}
   */
  async function updateProperty(id, propertyData) {
      if (!id) throw new Error('Property ID is required');
      if (!propertyData || Object.keys(propertyData).length === 0) {
          throw new Error('Property data is required');
      }
      return await apiRequest(`/api/v1/admin/units/${id}`, {
          method: 'PUT',
          body: JSON.stringify(propertyData)
      });
  }

  /**
   * Удалить объект недвижимости
   * @param {string} id - ID объекта
   * @returns {Promise<Object>}
   */
  async function deleteProperty(id) {
      if (!id) throw new Error('Property ID is required');
      return await apiRequest(`/api/v1/admin/units/${id}`, {
          method: 'DELETE'
      });
  }

  // Прикрепляем функции к глобальному объекту window
  window.PropertyAPI = {
    getAllProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty
  };

})(window);
