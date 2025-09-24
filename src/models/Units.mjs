// models/Unit.mjs
import pool from '../config/database.mjs';

class Unit {
  /**
   * Создать новый объект недвижимости
   * @param {Object} unitData - Данные объекта
   * @param {string} unitData.unique_id - Уникальный ID (обязательный)
   * @param {string} unitData.id -  ID
   * @param {string} unitData.name - Название
   * @param {string} unitData.type - Тип
   * @param {string} unitData.category - Категория
   * @param {number} [unitData.area] - Площадь (опционально)
   * @returns {Promise<number>} ID вставленной записи
   */
  static async create(unitData) {
    if (!unitData || typeof unitData !== 'object') {
      throw new Error('Invalid unit data provided');
    }

    const { unique_id, id, name, type, category, area } = unitData;

    if (!unique_id || !id || !name || !type || !category) {
      throw new Error('Missing required fields: unique_id, id, name, type, category');
    }

    const [result] = await pool.execute(
      `INSERT INTO units (
        unique_id,
        id,
        name,
        type,
        category,
        area,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        unique_id,
        id,
        name,
        type,
        category,
        area || null, // area может быть null
      ]
    );
    return result.insertId;
  }

  /**
   * Найти объект недвижимости по уникальному ID
   * @param {string} unique_id - Уникальный ID объекта
   * @returns {Promise<Object|null>}
   */
  static async findById(unique_id) {
    if (!unique_id) {
      throw new Error('Unique ID is required for search');
    }
    const [rows] = await pool.execute(
      'SELECT * FROM units WHERE unique_id = ? LIMIT 1',
      [unique_id]
    );
    return rows[0] || null;
  }

  /**
   * Найти объект недвижимости по оригинальному ID и категории
   * @param {string} id -  ID объекта
   * @param {string} category - Категория объекта
   * @returns {Promise<Object|null>}
   */
  static async findByOriginalIdAndCategory(id, category) {
    if (!id || !category) {
      throw new Error('Original ID and category are required for search');
    }
    const [rows] = await pool.execute(
      'SELECT * FROM units WHERE id = ? AND category = ? LIMIT 1',
      [id, category]
    );
    return rows[0] || null;
  }

  /**
   * Обновить объект недвижимости
   * @param {string} unique_id - Уникальный ID объекта
   * @param {Object} unitData - Данные для обновления
   * @returns {Promise<boolean>} true если успешно обновлено
   */
  static async update(unique_id, unitData) {
    if (!unique_id) {
      throw new Error('Unique ID is required for update');
    }

    if (!unitData || typeof unitData !== 'object' || Object.keys(unitData).length === 0) {
      throw new Error('Valid unit data is required for update');
    }

    const allowedFields = ['name', 'type', 'category', 'area'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (unitData[field] !== undefined) {
        updates.push(`${field} = ?`);
        // Для area, если передано null или пустая строка, сохраняем как NULL
        if (field === 'area' && (unitData[field] === null || unitData[field] === '')) {
          values.push(null);
        } else {
          values.push(unitData[field]);
        }
      }
    }

    if (updates.length === 0) {
      return false; // Нет данных для обновления
    }

    values.push(unique_id);

    const [result] = await pool.execute(
      `UPDATE units SET ${updates.join(', ')}, updated_at = NOW() WHERE unique_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * Удалить объект недвижимости
   * @param {string} unique_id - Уникальный ID объекта
   * @returns {Promise<boolean>} true если успешно удалено
   */
  static async delete(unique_id) {
    if (!unique_id) {
      throw new Error('Unique ID is required for deletion');
    }
    const [result] = await pool.execute(
      'DELETE FROM units WHERE unique_id = ?',
      [unique_id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Получить все объекты недвижимости с фильтрацией и пагинацией
   * @param {Object} filters - Фильтры
   * @param {string} [filters.type] - Фильтр по типу
   * @param {string} [filters.category] - Фильтр по категории
   * @param {string} [filters.search] - Поиск по названию или ID
   * @param {number} [filters.page=1] - Номер страницы
   * @param {number} [filters.limit=10] - Лимит записей на странице
   * @returns {Promise<{units: Array, total: number}>}
   */
  static async getAll(filters = {}) {
    let query = 'SELECT * FROM units WHERE 1=1';
    const countQuery = 'SELECT COUNT(*) as count FROM units WHERE 1=1';
    const values = [];
    const countValues = [];

    if (filters.type) {
      query += ' AND type = ?';
      countQuery += ' AND type = ?';
      values.push(filters.type);
      countValues.push(filters.type);
    }

    if (filters.category) {
      query += ' AND category = ?';
      countQuery += ' AND category = ?';
      values.push(filters.category);
      countValues.push(filters.category);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR id LIKE ? OR unique_id LIKE ?)';
      countQuery += ' AND (name LIKE ? OR id LIKE ? OR unique_id LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
      countValues.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY category, id';

    // Пагинация
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;
    -
      values.push(parseInt(limit), parseInt(offset)); // <-- ИСПРАВЛЕНО: явное преобразование в число

    const [rows] = await pool.execute(query, values);
    const [countResult] = await pool.execute(countQuery, countValues);

    return {
      units: rows,
      total: countResult[0].count
    };
  }

  // models/Unit.mjs

  // ... другие методы ...

  /**
   * Получить все объекты недвижимости, сгруппированные по категориям
   * Аналог структуры из вашего примера properties
   * @returns {Promise<Object>} Объект, где ключи - категории, значения - массивы объектов
   */
  static async getAllGroupedByCategory() {
    // Простой запрос на все записи, отсортированные по категории и ID
    const query = 'SELECT * FROM units ORDER BY category, id';
    const [rows] = await pool.execute(query); // Используем execute без параметров

    const grouped = {};
    rows.forEach(unit => {
      if (!grouped[unit.category]) {
        grouped[unit.category] = [];
      }
      // Возвращаем данные в формате, близком к оригинальному
      grouped[unit.category].push({
        id: unit.id, // Используем поле `id` из таблицы
        name: unit.name,
        type: unit.type,
        // area: unit.area // Можно также включить площадь, если нужно
      });
    });

    return grouped;
  }
}

export default Unit;