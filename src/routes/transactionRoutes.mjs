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
import { createReadStream } from 'fs';
import { mkdirSync, existsSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Путь для загрузки файлов
const UPLOAD_PATH = path.join(__dirname, '../../uploads');

// Настройка Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Определяем папку в зависимости от типа файла
    let dir = '';
    switch (file.fieldname) {
      case 'agreement':
        dir = path.join(UPLOAD_PATH, 'agreements');
        break;
      case 'receipt':
        dir = path.join(UPLOAD_PATH, 'receipts');
        break;
      case 'proof_documents':
        dir = path.join(UPLOAD_PATH, 'proofs');
        break;
      case 'video':
        dir = path.join(UPLOAD_PATH, 'videos');
        break;
      default:
        dir = path.join(UPLOAD_PATH, 'others');
    }

    // Создаём папку, если не существует
    try {
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      // Используем login из req.user (должен быть загружен в auth middleware)
      const userLogin = req.user?.login || 'unknown';
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
      // Ошибки в имени файла
      cb(error);
    }
  }
});

// Фильтрация файлов по MIME-типу
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'video/mp4',
    'video/quicktime'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'));
  }
};

// Экземпляр Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB
  }
});

// === Маршруты ===

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
router.post('/:id/documents', adminAuth, upload.any(), transactionController.uploadFiles);
router.get('/:id/documents', adminAuth, upload.any(), transactionController.getFiles);
router.delete('/:id/documents/:fileId', adminAuth, upload.any(), transactionController.deleteFile);

// Маршруты для работы с платежами
router.get('/:id/payments', adminAuth, transactionController.getPayments);

// Создание платежа с загрузкой чека
router.post('/:id/payments', adminAuth, upload.single('receipt'), transactionController.createPayment);

// Обновление платежа с возможной новой загрузкой чека
router.put('/:id/payments/:paymentId', adminAuth, upload.single('receipt'), [
  body('status').isIn(['pending', 'paid', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], transactionController.updatePayment);

// === Обработчик ошибок Multer (должен быть ПОСЛЕ всех маршрутов) ===
router.use((error, req, res, next) => {
  console.error('Multer error caught:', error);

  if (error instanceof multer.MulterError) {
    // Ошибки Multer (размер, кодировка и т.д.)
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size too large. Maximum 100 MB allowed.'
      });
    }
    return res.status(400).json({
      message: `File upload error: ${error.message}`
    });
  }

  // Ошибки от fileFilter или filename
  if (error.message === 'Unsupported file type') {
    return res.status(400).json({
      message: 'Unsupported file type. Only JPEG, PNG, PDF, MP4, MOV are allowed.'
    });
  }

  // Любые другие ошибки (например, в filename)
  return res.status(500).json({
    message: 'File processing failed',
    error: error.message
  });
});

// Маршрут для получения конкретного файла по относительному пути
router.get('/files/*', adminAuth, async (req, res) => {
  try {
    // Получаем относительный путь из URL (все, что после /files/)
    const relativePath = req.params[0]; // Используем req.params[0] для catch-all параметра
    
    if (!relativePath) {
      return res.status(400).json({
        success: false,
        message: "File path is required"
      });
    }
    
    // Декодируем URL-кодированный путь
    const decodedPath = decodeURIComponent(relativePath);
    
    // Нормализуем путь и удаляем недопустимые символы
    const normalizedPath = path.normalize(decodedPath)
      .replace(/^(\.\.[\/\\])+/, '') // Удаляем начальные ../ или ..\ 
      .replace(/\\/g, '/') // Заменяем обратные слеши на прямые
      .replace(/^\//, ''); // Удаляем начальный слеш если есть
    
    // Проверяем на попытки выхода за пределы разрешенной директории
    if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
      console.warn(`Path traversal attempt detected: ${decodedPath}`);
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    // Формируем безопасный абсолютный путь
    const safeFilePath = path.join(UPLOAD_PATH, normalizedPath);
    
    // Дополнительная проверка: убеждаемся, что путь находится внутри UPLOAD_PATH
    const realPath = path.resolve(safeFilePath);
    const realUploadPath = path.resolve(UPLOAD_PATH);
    
    if (!realPath.startsWith(realUploadPath)) {
      console.warn(`Path traversal attempt blocked: ${realPath} not in ${realUploadPath}`);
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    // Проверяем существование файла
    if (!existsSync(realPath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found on disk' 
      });
    }
    
    // Проверяем, является ли это файлом (а не директорией)
    const stats = statSync(realPath);
    if (!stats.isFile()) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    // Получаем информацию о файле из базы данных для проверки прав доступа
    const [files] = await pool.query(
      'SELECT * FROM transaction_files WHERE file_path = ?',
      [normalizedPath]
    );
    
    if (files.length === 0) {
      // Попробуем найти файл по декодированному пути
      const [filesByDecodedPath] = await pool.query(
        'SELECT * FROM transaction_files WHERE file_path = ?',
        [decodedPath]
      );
      
      if (filesByDecodedPath.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'File not found in database' 
        });
      }
      
      const file = filesByDecodedPath[0];
      
      // Устанавливаем правильные заголовки
      const contentType = file.file_type || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      
      // Определяем, нужно ли скачивать файл или отображать в браузере
      const isDownload = req.query.download === 'true';
      
      if (isDownload) {
        // Для скачивания устанавливаем заголовок Content-Disposition как attachment
        const originalName = file.original_name || file.file_name;
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
      } else {
        // Для отображения в браузере
        res.setHeader('Content-Disposition', 'inline');
      }
      
      // Создаем поток для отправки файла
      const fileStream = createReadStream(realPath);
      fileStream.pipe(res);
      
      // Обработка ошибок потока
      fileStream.on('error', (err) => {
        console.error(`Error sending file ${normalizedPath}:`, err);
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false, 
            message: 'Error sending file' 
          });
        }
      });
      
      return;
    }
    
    const file = files[0];
    
    // Устанавливаем правильные заголовки
    const contentType = file.file_type || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Определяем, нужно ли скачивать файл или отображать в браузере
    const isDownload = req.query.download === 'true';
    
    if (isDownload) {
      // Для скачивания устанавливаем заголовок Content-Disposition как attachment
      const originalName = file.original_name || file.file_name;
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
    } else {
      // Для отображения в браузере
      res.setHeader('Content-Disposition', 'inline');
    }
    
    // Создаем поток для отправки файла
    const fileStream = createReadStream(realPath);
    fileStream.pipe(res);
    
    // Обработка ошибок потока
    fileStream.on('error', (err) => {
      console.error(`Error sending file ${normalizedPath}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: 'Error sending file' 
        });
      }
    });
    
  } catch (error) {
    console.error('Error in file serving route:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
});

export default router;