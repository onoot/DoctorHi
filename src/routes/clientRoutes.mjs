//clientRoutes.mjs
import express from 'express';
import authController from '../controllers/authController.mjs';
import transactionController from '../controllers/transactionController.mjs';
import { auth, authLocale } from '../middlewares/auth.mjs';
import { body, query } from 'express-validator';
import Transaction from '../models/Transaction.mjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.mjs';

const router = express.Router();

// Transaction routes
router.post('/transactions/request', [
  auth,
  body('property_id').notEmpty().withMessage('Please specify property ID'),
  body('new_owner_name').notEmpty().withMessage('Please specify new owner name'),
  body('new_owner_cnic').notEmpty().withMessage('Please specify new owner CNIC')
], transactionController.requestTransaction);



// Маршрут для получения конкретного файла
router.get('/files/:fileId', auth, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    // Получаем информацию о файле из базы данных
    const [files] = await pool.query(`
      SELECT tf.*, t.id as transaction_id 
      FROM transaction_files tf
      JOIN transactions t ON tf.transaction_id = t.id
      WHERE tf.id = ?
    `, [fileId]);
    
    if (files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const file = files[0];
    
    // Проверяем, что файл принадлежит транзакции, к которой у администратора есть доступ
    // Для администратора мы не проверяем права на конкретную транзакцию, так как он имеет доступ ко всем
    
    // Формируем полный путь к файлу
    let filePath = file.file_path;
    
    // Если путь не абсолютный, добавляем UPLOAD_PATH
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(UPLOAD_PATH, filePath);
    }
    
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }
    
    // Определяем, нужно ли скачивать файл или отображать в браузере
    const isDownload = req.query.download === 'true';
    
    // Устанавливаем правильные заголовки
    res.setHeader('Content-Type', file.file_type);
    
    if (isDownload) {
      // Для скачивания устанавливаем заголовок Content-Disposition как attachment
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    } else {
      // Для отображения в браузере
      res.setHeader('Content-Disposition', 'inline');
    }
    
    // Устанавливаем заголовки CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Создаем поток для отправки файла
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
    
    // Обработка ошибок потока
    fileStream.on('error', (err) => {
      console.error(`Error sending file ${fileId}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error sending file' });
      }
    });
    
  } catch (error) {
    console.error('Error in file serving route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/transactions', auth, transactionController.getUserTransactions);

// Новый маршрут для получения истории транзакций объекта
router.get('/get-object', [
    query('property_id').notEmpty().withMessage('Property ID is required')
], async (req, res) => {
    try {
        const propertyId = req.query.property_id;


        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ isAuthenticated: false, message: 'No token provided' });
        }
    
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user exists and is not blocked
        const [users] = await pool.query(
          'SELECT id, name, cnic, email, role, status FROM users WHERE id = ?',
          [decoded.id]
        );
        
        const user = users[0];
        if (!user || user.status === 'blocked') {
          return res.status(401).json({ 
            isAuthenticated: false, 
            message: 'User not found or blocked' 
          });
        }
       
        const transactions = await Transaction.getObjectTransactions(propertyId, decoded.id);
        
        res.json({
            success: true,
            transactions: transactions
        });
    } catch (error) {
        console.error('Error getting object transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting object transactions'
        });
    }
});

// Transfer Request routes
router.post('/transfer-request', [
    authLocale,
    body('property_id').notEmpty().withMessage('Property ID is required'),
    body('requester_name').notEmpty().withMessage('Requester name is required'),
    body('requester_cnic').notEmpty().withMessage('Requester CNIC is required')
], async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return res.status(401).json({ isAuthenticated: false, message: 'No token provided' });
            }
        
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if user exists and is not blocked
            const [users] = await pool.query(
              'SELECT id, name, cnic, email, role, status FROM users WHERE id = ?',
              [decoded.id]
            );
            
            const user = users[0];
            if (!user || user.status === 'blocked') {
              return res.status(401).json({ 
                isAuthenticated: false, 
                message: 'User not found or blocked' 
              });
            }

        const requestData = {
            property_id: req.body.property_id,
            requester_id: decoded.id,
            requester_name: req.body.name,
            requester_cnic: req.body.cnic
        };
        console.log("Чебурек",requestData);

        const requestId = await Transaction.createTransferRequest(requestData);
        
        res.json({
            success: true,
            message: 'Transfer request created successfully',
            request_id: requestId
        });
    } catch (error) {
        console.error('Error creating transfer request:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating transfer request'
        });
    }
});


export default router; 