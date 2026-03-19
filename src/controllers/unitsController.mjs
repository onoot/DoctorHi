// controllers/unitsController.mjs
import { body, validationResult } from 'express-validator';
import Unit from '../models/Units.mjs';
import pool from '../config/database.mjs';

// Validators
export const createUnitValidators = [
  body('id').notEmpty().trim().withMessage('Unique ID is required'),
  // id removed from create form (server will auto-generate if absent)
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('type').notEmpty().trim().withMessage('Type is required'),
  body('category').notEmpty().trim().withMessage('Category is required'),
  body('area').optional().isNumeric().withMessage('Area must be a number'),
  body('price').optional().isNumeric().withMessage('Price must be a number')
];

export const updateUnitValidators = [
  body('name').optional().notEmpty().trim().withMessage('Name cannot be empty'),
  body('type').optional().notEmpty().trim().withMessage('Type cannot be empty'),
  body('category').optional().notEmpty().trim().withMessage('Category cannot be empty'),
  body('area').optional().isNumeric().withMessage('Area must be a number'),
  body('price').optional().isNumeric().withMessage('Price must be a number')
];

class UnitsController {
  /**
   * Get all property units (with filtering and pagination)
   */
  async getAll(req, res) {
    try {
      const filters = {
        type: req.query.type,
        category: req.query.category,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit||100
      };

      const result = await Unit.getAll(filters);
      
      res.json({ 
        success: true, 
        units: result.units,
        pagination: {
          total: result.total,
          page: parseInt(filters.page) || 1,
          limit: parseInt(filters.limit) || 100,
          totalPages: Math.ceil(result.total / (parseInt(filters.limit) || 100))
        }
      });
    } catch (error) {
      console.error('Error fetching units:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching property units',
        error: error.message 
      });
    }
  }

  /**
   * Get units grouped by category (for public access)
   */
  async getAllGroupedByCategory(req, res) {
    try {
      const groupedUnits = await Unit.getAllGroupedByCategory();
      res.json({ 
        success: true, 
        properties: groupedUnits 
      });
    } catch (error) {
      console.error('Error fetching grouped units:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching grouped units',
        error: error.message 
      });
    }
  }

  /**
   * Get specific property unit by id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Unique ID is required' 
        });
      }

      const unit = await Unit.findById(id);
      
      if (!unit) {
        return res.status(404).json({ 
          success: false, 
          message: 'Property unit not found' 
        });
      }

      res.json({ 
        success: true, 
        unit 
      });
    } catch (error) {
      console.error('Error fetching unit:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching property unit',
        error: error.message 
      });
    }
  }

  /**
   * Create new property unit
   */
  async create(req, res) {
    try {
      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation errors',
          errors: errors.array() 
        });
      }

      const unitData = req.body;

      // Check if id exists
      const existingUnit = await Unit.findById(unitData.id);
      if (existingUnit) {
        return res.status(409).json({ 
          success: false, 
          message: 'Property unit with this unique ID already exists' 
        });
      }

      // Check if id and category combination exists (if id provided)
      const checkId = unitData.id || unitData.id;
      const existingOriginal = await Unit.findByOriginalIdAndCategory(
        checkId, 
        unitData.category
      );
      if (existingOriginal) {
        return res.status(409).json({ 
          success: false, 
          message: 'Property unit with this ID and category already exists' 
        });
      }

      const insertId = await Unit.create(unitData);
      
      res.status(201).json({ 
        success: true, 
        message: 'Property unit created successfully',
        insertId,
        id: unitData.id
      });
    } catch (error) {
      console.error('Error creating unit:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating property unit',
        error: error.message 
      });
    }
  }

  /**
   * Update property unit
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const unitData = req.body;

      if (!id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Unique ID is required' 
        });
      }

      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation errors',
          errors: errors.array() 
        });
      }

      // Check if unit exists
      const existingUnit = await Unit.findById(id);
      if (!existingUnit) {
        return res.status(404).json({ 
          success: false, 
          message: 'Property unit not found' 
        });
      }

      // If id or category are being changed, check uniqueness
      if (unitData.id || unitData.category) {
        const checkId = unitData.id || existingUnit.id;
        const checkCategory = unitData.category || existingUnit.category;
        
        const existingOriginal = await Unit.findByOriginalIdAndCategory(
          checkId, 
          checkCategory
        );
        
        // If found another unit with same id and category (not current one)
        if (existingOriginal && existingOriginal.id !== id) {
          return res.status(409).json({ 
            success: false, 
            message: 'Property unit with this ID and category already exists' 
          });
        }
      }

      const updated = await Unit.update(id, unitData);
      
      if (!updated) {
        return res.status(400).json({ 
          success: false, 
          message: 'No data to update or unit not found' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Property unit updated successfully',
        id 
      });
    } catch (error) {
      console.error('Error updating unit:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating property unit',
        error: error.message 
      });
    }
  }

  /**
   * Delete property unit
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Unique ID is required' 
        });
      }

      // Check if unit exists
      const existingUnit = await Unit.findById(id);
      if (!existingUnit) {
        return res.status(404).json({ 
          success: false, 
          message: 'Property unit not found' 
        });
      }

      const deleted = await Unit.delete(id);
      
      if (!deleted) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to delete property unit' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Property unit deleted successfully',
        id 
      });
    } catch (error) {
      console.error('Error deleting unit:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting property unit',
        error: error.message 
      });
    }
  }

  /**
   * Get unique types and categories (for filters)
   */
  async getFilterOptions(req, res) {
    try {
      const [types] = await pool.query('SELECT DISTINCT type FROM units ORDER BY type');
      const [categories] = await pool.query('SELECT DISTINCT category FROM units ORDER BY category');
      
      res.json({ 
        success: true, 
        types: types.map(t => t.type),
        categories: categories.map(c => c.category)
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching filter options',
        error: error.message 
      });
    }
  }
}

export default new UnitsController();