// transactionRoutes.mjs
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import transactionController from '../controllers/transactionController.mjs';
import { auth, adminAuth, authLocale } from '../middlewares/auth.mjs';
import { body } from 'express-validator';
import pool from '../config/database.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Используем UPLOAD_PATH из контроллера
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');

// Настройка Multer — единая логика с контроллером
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ваш существующий код для destination
  },
  filename: async (req, file, cb) => {
    try {
      // ИСПОЛЬЗУЕМ ПРЯМОЙ ИМПОРТ pool ВМЕСТО transactionController.pool
      const [users] = await pool.query(
        'SELECT login FROM users WHERE id = ?',
        [req.user.id]
      );
      
      const userLogin = users[0]?.login || 'unknown';
      const ext = path.extname(file.originalname);
      const categoryNames = {
        agreement: 'Agreement',
        receipt: 'Receipt',
        proof_documents: 'Document',
        video: 'Video'
      };
      const baseName = categoryNames[file.fieldname] || 'File';
      const date = new Date().toISOString().split('T')[0];
      const fileName = `${baseName}_${userLogin}_${date}${ext}`;
      cb(null, fileName);
    } catch (error) {
      cb(error);
    }
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/png': true,
    'application/pdf': true,
    'video/mp4': true,
    'video/quicktime': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB
  }
});

// Маршруты для пользователей
router.get('/my', auth, transactionController.getUserTransactions);
router.get('/my/:propertyId', auth, transactionController.getUserPropertyTransactions);
router.put('/my/:id', auth, [
  body('status').isIn(['pending', 'cancelled']).withMessage('Invalid status')
], transactionController.updateUserTransaction);

// Маршруты для администраторов
router.post('/', adminAuth, [
  body('property_id').notEmpty().withMessage('Property ID is required'),
  body('new_owner_id').notEmpty().isInt().withMessage('Valid new owner ID is required'),
  body('total_amount').isNumeric().withMessage('Valid total amount is required')
], transactionController.create);

router.get('/', adminAuth, transactionController.getAll);
router.get('/:id', adminAuth, transactionController.getById);

router.put('/:id', adminAuth, [
  body('status').isIn(['pending', 'approved', 'rejected', 'cancelled']).withMessage('Invalid status'),
  body('admin_notes').optional().isString().withMessage('Notes must be a string')
], transactionController.update);

// Загрузка документов и видео
router.post('/:id/documents', adminAuth, transactionController.uploadFiles);

router.get('/:id/documents', adminAuth, transactionController.getFiles);
router.delete('/:id/documents/:fileId', adminAuth, transactionController.deleteFile);

// Маршруты для работы с платежами
router.get('/:id/payments', adminAuth, transactionController.getPayments);

router.post('/:id/payments', adminAuth, upload.single('receipt'), transactionController.createPayment);

router.put('/:id/payments/:paymentId', adminAuth, upload.single('receipt'), [
  body('status').isIn(['pending', 'paid', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], transactionController.updatePayment);

export default router;