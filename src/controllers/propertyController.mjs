// controllers/propertyController.mjs
import pool from '../config/database.mjs';

class PropertyController {

  /**
   * Получить все объекты недвижимости
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  async getAll(req, res) {
    try {
      const [rows] = await pool.execute('SELECT * FROM units ORDER BY category, id');
      res.json({
        success: true,
        properties: rows
      });
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching properties'
      });
    }
  }

  /**
   * Получить объект недвижимости по ID
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }

      const [rows] = await pool.execute('SELECT * FROM units WHERE id = ?', [id]);
      const property = rows[0];

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      res.json({
        success: true,
        property: property
      });
    } catch (error) {
      console.error('Error fetching property:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching property'
      });
    }
  }

  /**
   * Создать новый объект недвижимости
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  async create(req, res) {
    try {
      const { id, name, type, category, area } = req.body;

      // Валидация входных данных
      if (!id || !name || !type || !category) {
        return res.status(400).json({
          success: false,
          message: 'ID, name, type, and category are required'
        });
      }

      // Проверка на существование
      const [existing] = await pool.execute('SELECT id FROM units WHERE id = ?', [id]);
      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Property with this ID already exists'
        });
      }

      const [result] = await pool.execute(
        'INSERT INTO units (id, name, type, category, area) VALUES (?, ?, ?, ?, ?)',
        [id, name, type, category, area || null] // area может быть null
      );

      if (result.affectedRows === 1) {
        const newProperty = { id, name, type, category, area: area || null };
        res.status(201).json({
          success: true,
          message: 'Property created successfully',
          property: newProperty
        });
      } else {
        throw new Error('Failed to insert property');
      }
    } catch (error) {
      console.error('Error creating property:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating property'
      });
    }
  }

  /**
   * Обновить объект недвижимости
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, type, category, area } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }

      // Проверка на существование
      const [existing] = await pool.execute('SELECT id FROM units WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      const [result] = await pool.execute(
        'UPDATE units SET name = ?, type = ?, category = ?, area = ? WHERE id = ?',
        [name, type, category, area || null, id]
      );

      if (result.affectedRows === 1) {
        const updatedProperty = { id, name, type, category, area: area || null };
        res.json({
          success: true,
          message: 'Property updated successfully',
          property: updatedProperty
        });
      } else {
        throw new Error('Failed to update property');
      }
    } catch (error) {
      console.error('Error updating property:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating property'
      });
    }
  }

  /**
   * Удалить объект недвижимости
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }

      // Проверка на существование
      const [existing] = await pool.execute('SELECT id FROM units WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      // TODO: Проверить, не используется ли объект в транзакциях, прежде чем удалять
      const [usedInTransactions] = await pool.execute('SELECT COUNT(*) as cnt FROM transactions WHERE property_id = ?', [id]);
      if (usedInTransactions[0].cnt > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete property: it is used in transactions'
        });
      }

      const [result] = await pool.execute('DELETE FROM units WHERE id = ?', [id]);

      if (result.affectedRows === 1) {
        res.json({
          success: true,
          message: 'Property deleted successfully'
        });
      } else {
        throw new Error('Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting property'
      });
    }
  }
}

export default new PropertyController();