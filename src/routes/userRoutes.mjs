import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { create, getAll, getById, update, remove } from '../controllers/userController.mjs';
import { auth, adminAuth } from '../middlewares/auth.mjs';
import { body } from 'express-validator';
import pool from '../config/database.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Конфигурация multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Маршруты для администраторов
// userRoutes.mjs - обновленная валидация

router.post('/', adminAuth, [
  body('name').notEmpty().withMessage('Enter name'),
  // Проверяем, что передан хотя бы один из: login или email
  body().custom((value, { req }) => {
    if (!req.body.login && !req.body.email) {
      throw new Error('Either login or email is required');
    }
    return true;
  }),
  body('login').optional().isLength({ min: 3 }).withMessage('Login must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('cnic').notEmpty().withMessage('Enter CNIC'),
  body('phone').notEmpty().withMessage('Enter phone number')
], create);

router.put('/:id', adminAuth, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('login').optional().isLength({ min: 3 }).withMessage('Login must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('cnic').optional().notEmpty().withMessage('CNIC cannot be empty'),
  body('status').optional().isIn(['active', 'blocked', 'archived']).withMessage('Invalid status')
], update);

router.get('/', adminAuth, getAll);
router.get('/:id', adminAuth, getById);

router.delete('/:id', adminAuth, remove);

// Маршрут для получения профиля текущего пользователя
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.query(
      'SELECT id, name, login, cnic, status, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});
// Добавляем маршруты для архивации пользователей
router.post('/:id/archive', adminAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const [result] = await pool.query(
      'UPDATE users SET status = "archived" WHERE id = ? AND status IN ("active", "blocked")',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found or already archived' 
      });
    }

    res.json({
      success: true,
      message: 'User archived successfully'
    });
  } catch (error) {
    console.error('Error archiving user:', error);
    res.status(500).json({
      success: false,
      message: 'Error archiving user'
    });
  }
});

// Маршрут для восстановления пользователя из архива
router.post('/:id/unarchive', adminAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const [result] = await pool.query(
      'UPDATE users SET status = "active" WHERE id = ? AND status = "archived"',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found or not in archive' 
      });
    }

    res.json({
      success: true,
      message: 'User restored from archive successfully'
    });
  } catch (error) {
    console.error('Error unarchiving user:', error);
    res.status(500).json({
      success: false,
      message: 'Error unarchiving user'
    });
  }
});

router.get('/:id/units', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем существование пользователя
    const [userRows] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND status = "active"',
      [id]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Получаем все units пользователя из ownership_history
    const [units] = await pool.execute(`
      SELECT 
        u.*,
        oh.from_date,
        oh.to_date
      FROM ownership_history oh
      JOIN units u ON oh.property_id = u.id
      WHERE oh.owner_id = ? 
        AND (oh.to_date IS NULL OR oh.to_date > NOW())
      ORDER BY oh.from_date DESC
    `, [id]);
    
    res.json({
      success: true,
      units: units || []
    });
    
  } catch (error) {
    console.error('Error fetching user units:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user units',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Модифицируем существующий маршрут GET /users для поддержки фильтрации
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT id, name, login, cnic, status, role, created_at FROM users';
    let params = [];

    if (status && status !== 'all' && status !== 'archived') {
      query += ' WHERE status = ?';
      params.push(status);
    } else if (status === 'archived') {
      query += ' WHERE status = "archived"';
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await pool.query(query, params);
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 