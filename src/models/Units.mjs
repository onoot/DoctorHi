// models/Units.mjs
import pool from '../config/database.mjs';

class Unit {
  /**
   * Create new property unit
   */
  static async create(unitData) {
    if (!unitData || typeof unitData !== 'object') {
      throw new Error('Invalid unit data provided');
    }

    const { id, name, type, category, area, price } = unitData;

    // Проверка обязательных полей
    if (!id || !name || !type || !category) {
      throw new Error('Missing required fields: id, name, type, category');
    }

    const [result] = await pool.execute(
      `INSERT INTO units (
        id,
        name,
        type,
        category,
        area,
        price,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`, // Убрал один ? перед NOW()
      [
        id,
        name,
        type,
        category,
        area || null,
        price || null,
        // NOW() не передается как параметр, он вызывается в SQL
      ]
    );
    return result.insertId;
  }

  // Остальные методы остаются без изменений...
  /**
   * Get all property units with filtering and pagination
   */
  static async getAll(filters = {}) {
    let query = 'SELECT * FROM units WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as count FROM units WHERE 1=1';
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
      query += ' AND (name LIKE ? OR id LIKE ?)';
      countQuery += ' AND (name LIKE ? OR id LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm);
      countValues.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY category, id';

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, values);
    const [countResult] = await pool.execute(countQuery, countValues);

    return {
      units: rows,
      total: countResult[0].count
    };
  }

  /**
   * Find property unit by unique ID
   */
  static async findById(id) {
    if (!id) {
      throw new Error('Unique ID is required for search');
    }
    const [rows] = await pool.execute(
      'SELECT * FROM units WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find property unit by original ID and category
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
   * Update property unit
   */
  static async update(id, unitData) {
    if (!id) {
      throw new Error('Unique ID is required for update');
    }

    if (!unitData || typeof unitData !== 'object' || Object.keys(unitData).length === 0) {
      throw new Error('Valid unit data is required for update');
    }

    const allowedFields = ['name', 'type', 'category', 'area', 'price'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (unitData[field] !== undefined) {
        updates.push(`${field} = ?`);
        if ((field === 'area' || field === 'price') && (unitData[field] === null || unitData[field] === '')) {
          values.push(null);
        } else {
          values.push(unitData[field]);
        }
      }
    }

    if (updates.length === 0) {
      return false;
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE units SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * Delete property unit
   */
  static async delete(id) {
    if (!id) {
      throw new Error('Unique ID is required for deletion');
    }
    const [result] = await pool.execute(
      'DELETE FROM units WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Get all property units grouped by category
   */
  static async getAllGroupedByCategory() {
    const query = 'SELECT * FROM units ORDER BY category, id';
    const [rows] = await pool.execute(query);

    const grouped = {};
    rows.forEach(unit => {
      if (!grouped[unit.category]) {
        grouped[unit.category] = [];
      }
      grouped[unit.category].push({
        id: unit.id,
        name: unit.name,
        type: unit.type,
        area: unit.area,
        price: unit.price || null
      });
    });

    return grouped;
  }
}

export default Unit;