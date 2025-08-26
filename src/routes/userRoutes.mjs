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
router.post('/', adminAuth, [
  body('name').notEmpty().withMessage('Enter name'),
  body('login').notEmpty().withMessage('Enter login'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('cnic').notEmpty().withMessage('Enter CNIC')
], create);

router.get('/', adminAuth, getAll);
router.get('/:id', adminAuth, getById);

router.put('/:id', adminAuth, [
  body('name').optional().notEmpty().withMessage('Enter name'),
  body('login').optional().notEmpty().withMessage('Enter login'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('cnic').optional().notEmpty().withMessage('Enter CNIC'),
  body('status').optional().isIn(['active', 'blocked', 'archived']).withMessage('Invalid status')
], update);

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