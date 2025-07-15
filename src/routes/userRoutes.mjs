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
  body('status').optional().isIn(['active', 'blocked']).withMessage('Invalid status')
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

export default router; 