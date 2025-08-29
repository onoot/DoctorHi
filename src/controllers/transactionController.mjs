import { validationResult } from 'express-validator';
import pool from '../config/database.mjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Путь для хранения файлов
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');

// Проверяем и создаем директорию, если она не существует
const ensureDirectoryExists = async (dirPath) => {
    try {
        await fs.access(dirPath);
    } catch (error) {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
};

// Инициализируем основные директории
const initializeUploadDirectories = async () => {
    try {
        await ensureDirectoryExists(path.join(UPLOAD_PATH, 'transactions'));
        await ensureDirectoryExists(path.join(UPLOAD_PATH, 'transactions', 'agreements'));
        await ensureDirectoryExists(path.join(UPLOAD_PATH, 'transactions', 'receipts'));
        await ensureDirectoryExists(path.join(UPLOAD_PATH, 'transactions', 'documents'));
        await ensureDirectoryExists(path.join(UPLOAD_PATH, 'transactions', 'videos'));
        console.log('Upload directories created successfully');
    } catch (error) {
        console.error('Error creating upload directories:', error);
        throw error;
    }
};

// Инициализируем директории
initializeUploadDirectories();

// Настройка загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir;
    switch (file.fieldname) {
      case 'agreement':
        uploadDir = path.join(UPLOAD_PATH, 'transactions', 'agreements');
        break;
      case 'receipt':
        uploadDir = path.join(UPLOAD_PATH, 'transactions', 'receipts');
        break;
      case 'proof_documents':
        uploadDir = path.join(UPLOAD_PATH, 'transactions', 'documents');
        break;
      default:
        uploadDir = path.join(UPLOAD_PATH, 'transactions');
    }
    cb(null, uploadDir);
  },
  filename: async (req, file, cb) => {
    try {
      const [users] = await pool.query('SELECT login FROM users WHERE id = ?', [req.user.id]);
      const userLogin = users[0]?.login || 'unknown';
      const fileName = generateFileName(file.originalname, file.fieldname, userLogin);
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
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // максимум 5 файлов за раз
  }
});

// Предопределенные объекты недвижимости
const properties = {
  'Parking': [
    { id: 'DH01', name: 'Parking DH01', type: 'parking' },
    { id: 'DH02', name: 'Parking DH02', type: 'parking' },
    { id: 'DH03', name: 'Parking DH03', type: 'parking' }
  ],
  "Lower Basement": [
    { "id": "LB01", "name": "Parking LB01", "type": "parking" },
    { "id": "LB02", "name": "Parking LB02", "type": "parking" },
    { "id": "LB03", "name": "Parking LB03", "type": "parking" },
    { "id": "LB04", "name": "Parking LB04", "type": "parking" },
    { "id": "LB05", "name": "Parking LB05", "type": "parking" },
    { "id": "LB06", "name": "Parking LB06", "type": "parking" },
    { "id": "LB07", "name": "Parking LB07", "type": "parking" },
    { "id": "LB08", "name": "Parking LB08", "type": "parking" },
    { "id": "LB09", "name": "Parking LB09", "type": "parking" },
    { "id": "LB10", "name": "Parking LB10", "type": "parking" },
    { "id": "LB11", "name": "Parking LB11", "type": "parking" },
    { "id": "LB12", "name": "Parking LB12", "type": "parking" }
  ],
  "Upper Basement": [
    { "id": "UB01", "name": "Parking UB01", "type": "parking" },
    { "id": "UB02", "name": "Parking UB02", "type": "parking" },
    { "id": "UB03", "name": "Parking UB03", "type": "parking" },
    { "id": "UB04", "name": "Parking UB04", "type": "parking" },
    { "id": "UB05", "name": "Parking UB05", "type": "parking" },
    { "id": "UB06", "name": "Parking UB06", "type": "parking" },
    { "id": "UB07", "name": "Parking UB07", "type": "parking" },
    { "id": "UB08", "name": "Parking UB08", "type": "parking" },
    { "id": "UB09", "name": "Parking UB09", "type": "parking" },
    { "id": "UB10", "name": "Parking UB10", "type": "parking" },
    { "id": "UB11", "name": "Parking UB11", "type": "parking" },
    { "id": "UB12", "name": "Parking UB12", "type": "parking" }
  ],
  'Ground Floor': [
    { id: 'DH01', name: 'Shop DH01', type: 'commercial' },
    { id: 'DH02', name: 'Shop DH02', type: 'commercial' },
    { id: 'DH03', name: 'Shop DH03', type: 'commercial' }
  ],
  '1st Floor': [
    { id: 'DH101', name: 'Office DH101', type: 'commercial' },
    { id: 'DH102', name: 'Office DH102', type: 'commercial' },
    { id: 'DH103', name: 'Office DH103', type: 'commercial' }
  ],
  '2nd Floor': [
    { id: 'DH201', name: 'Office DH201', type: 'commercial' },
    { id: 'DH202', name: 'Office DH202', type: 'commercial' },
    { id: 'DH203', name: 'Office DH203', type: 'commercial' }
  ],
  '3rd Floor': [
    { id: 'DH301', name: 'Apartment DH301 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH302', name: 'Apartment DH302 (973.7 Sft)', type: 'residential' },
    { id: 'DH303', name: 'Apartment DH303 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH304', name: 'Apartment DH304 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH305', name: 'Apartment DH305 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH306', name: 'Apartment DH306 (1,686.00 Sft)', type: 'residential' }
  ],
  '4th Floor': [
    { id: 'DH401', name: 'Apartment DH401 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH402', name: 'Apartment DH402 (973.7 Sft)', type: 'residential' },
    { id: 'DH403', name: 'Apartment DH403 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH404', name: 'Apartment DH404 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH405', name: 'Apartment DH405 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH406', name: 'Apartment DH406 (1,686.00 Sft)', type: 'residential' }
  ],
  '5th Floor': [
    { id: 'DH501', name: 'Apartment DH501 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH502', name: 'Apartment DH502 (973.7 Sft)', type: 'residential' },
    { id: 'DH503', name: 'Apartment DH503 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH504', name: 'Apartment DH504 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH505', name: 'Apartment DH505 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH506', name: 'Apartment DH506 (1,686.00 Sft)', type: 'residential' }
  ],
  '6th Floor': [
    { id: 'DH601', name: 'Apartment DH601 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH602', name: 'Apartment DH602 (973.7 Sft)', type: 'residential' },
    { id: 'DH603', name: 'Apartment DH603 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH604', name: 'Apartment DH604 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH605', name: 'Apartment DH605 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH606', name: 'Apartment DH606 (1,686.00 Sft)', type: 'residential' }
  ],
  '7th Floor': [
    { id: 'DH701', name: 'Apartment DH701 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH702', name: 'Apartment DH702 (973.7 Sft)', type: 'residential' },
    { id: 'DH703', name: 'Apartment DH703 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH704', name: 'Apartment DH704 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH705', name: 'Apartment DH705 (1,198.3 Sft)', type: 'residential' },
    { id: 'DH706', name: 'Apartment DH706 (1,686.00 Sft)', type: 'residential' }
  ],
  'Penthouse': [
    { id: 'PH', name: 'Penthouse (7,350.00 Sft)', type: 'penthouse' }
  ]
};

// Функция для проверки существования объекта недвижимости
function getPropertyById(propertyId) {
  for (const category of Object.values(properties)) {
    const property = category.find(p => p.id === propertyId);
    if (property) return property;
  }
  return null;
}

// Get previous owner from ownership history
async function getPreviousOwner(propertyId) {
  const [owners] = await pool.query(`
        SELECT owner_id
        FROM ownership_history
        WHERE property_id = ?
        ORDER BY from_date DESC
        LIMIT 1
    `, [propertyId]);

  return owners.length > 0 ? owners[0].owner_id : null;
}

// Update file naming function
function generateFileName(originalName, category, userLogin) {
  const date = new Date().toISOString().split('T')[0];
  const ext = path.extname(originalName);
  const categoryNames = {
    agreement: 'Agreement',
    receipt: 'Receipt',
    proof_documents: 'Document',
    video: 'Video'
  };

  return `${categoryNames[category]}_${userLogin}_${date}${ext}`;
}

const transactionController = {
  // Получение сделок пользователя
  async getUserTransactions(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const userId = req.user.id;
      const offset = (page - 1) * limit;

      let query = `
      SELECT t.*, 
             u1.name as previous_owner_name,
             u2.name as new_owner_name
      FROM transactions t
        LEFT JOIN users u1 ON t.previous_owner_id = u1.id
        LEFT JOIN users u2 ON t.new_owner_id = u2.id
      WHERE (t.previous_owner_id = ? OR t.new_owner_id = ?)
    `;
      const queryParams = [userId, userId];

      if (status) {
        query += ' AND t.status = ?';
        queryParams.push(status);
      }

      query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(parseInt(limit), offset);

      const [transactions] = await pool.query(query, queryParams);

      // Получаем общее количество
      const [totalRows] = await pool.query(
        'SELECT COUNT(*) as count FROM transactions WHERE previous_owner_id = ? OR new_owner_id = ?',
        [userId, userId]
      );

      const total = totalRows[0].count;
      const totalPages = Math.ceil(total / limit);

      // Добавляем информацию о свойствах
      const enrichedTransactions = transactions.map(transaction => {
        const property = getPropertyById(transaction.property_id);
        return {
          ...transaction,
          property_name: property ? property.name : 'Unknown Property',
          property_type: property ? property.type : 'unknown'
        };
      });

      res.json({
        transactions: enrichedTransactions,
        total,
        page: parseInt(page),
        pages: totalPages
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Получение всех сделок (только админ)
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      console.log('Getting transactions with:', { page, limit, offset });

      // Получаем транзакции вместе с именами пользователей одним запросом
      const [transactions] = await pool.query(`
        SELECT 
          t.*,
          u1.name as previous_owner_name,
          u2.name as new_owner_name
        FROM transactions t
        LEFT JOIN users u1 ON t.previous_owner_id = u1.id
        LEFT JOIN users u2 ON t.new_owner_id = u2.id
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `, [parseInt(limit), parseInt(offset)]);

      // Получаем общее количество транзакций
      const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM transactions');
      const total = totalRows[0].count;

      // Обогащаем транзакции информацией о свойствах
      const enrichedTransactions = transactions.map(transaction => {
        const property = getPropertyById(transaction.property_id);
        return {
          id: transaction.id,
          property_id: transaction.property_id,
          property_name: property ? property.name : 'Unknown Property',
          property_type: property ? property.type : 'unknown',
          previous_owner_id: transaction.previous_owner_id,
          previous_owner_name: transaction.previous_owner_name || 'Unknown User',
          new_owner_id: transaction.new_owner_id,
          new_owner_name: transaction.new_owner_name || 'Unknown User',
          status: transaction.status,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at
        };
      });

      res.json({
        success: true,
        transactions: enrichedTransactions,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error' });
    }
  },

  // Получение сделки по ID (только админ)
  async getById(req, res) {
    try {
      // Получаем основную информацию о транзакции
      const transactionId = parseInt(req.params.id);

      const [transactions] = await pool.query(`
        SELECT t.*, 
               u1.name as previous_owner_name,
               u2.name as new_owner_name,
               COALESCE(SUM(CASE WHEN tp.status = 'paid' THEN tp.amount ELSE 0 END), 0) as total_paid,
               COUNT(DISTINCT tp.id) as total_payments,
               COUNT(DISTINCT CASE WHEN tp.status = 'paid' THEN tp.id END) as completed_payments
        FROM transactions t
        LEFT JOIN users u1 ON t.previous_owner_id = u1.id
        LEFT JOIN users u2 ON t.new_owner_id = u2.id
        LEFT JOIN transaction_payments tp ON t.id = tp.transaction_id
        WHERE t.id = ?
        GROUP BY t.id
      `, [transactionId]);


      console.log("Ебать", transactions)
      if (transactions.length === 0) {
        return res.status(404).json({ message: 'Транзакция не найдена' });
      }


      const [dbWitnesses] = await pool.query(
        'SELECT witness_type, name, cnic, phone FROM transaction_witnesses WHERE transaction_id = ?',
        [transactionId]
      );

      // Преобразуем массив в объект с witness1 и witness2
      const witnesses = dbWitnesses.reduce((acc, witness) => {
        acc[witness.witness_type] = {
          name: witness.name,
          cnic: witness.cnic,
          phone: witness.phone
        };
        return acc;
      }, {});



      // Получаем все платежи для транзакции
      const [payments] = await pool.query(`
        SELECT p.*, 
               f.file_path, 
               f.original_name as receipt_name,
               f.file_type as receipt_type
        FROM transaction_payments p
        LEFT JOIN transaction_files f ON p.receipt_file_id = f.id
        WHERE p.transaction_id = ?
        ORDER BY p.payment_date ASC
      `, [req.params.id]);

      // Получаем все файлы транзакции
      const [files] = await pool.query(`
        SELECT id, file_name, original_name, file_type, file_path, category, created_at
        FROM transaction_files
        WHERE transaction_id = ?
        ORDER BY created_at DESC
      `, [req.params.id]);

      // Формируем ответ
      const currentTransaction = transactions[0];
      const property = getPropertyById(currentTransaction.property_id);

      const { witnesses: transactionWitnesses, ...transactionData } = currentTransaction;
      const response = {
        ...transactionData,
        witnesses,
        property_name: property ? property.name : 'Unknown Property',
        property_type: property ? property.type : 'unknown',
        payments: payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          payment_date: payment.payment_date,
          status: payment.status,
          payment_method: payment.payment_method,
          notes: payment.notes,
          receipt: payment.file_path ? {
            path: payment.file_path,
            name: payment.receipt_name,
            type: payment.receipt_type
          } : null,
          created_at: payment.created_at,
          updated_at: payment.updated_at
        })),
        files: files.reduce((acc, file) => {
          if (!acc[file.category]) {
            acc[file.category] = [];
          }
          acc[file.category].push({
            id: file.id,
            name: file.original_name,
            path: file.file_path,
            type: file.file_type,
            created_at: file.created_at
          });
          return acc;
        }, {}),
        payment_summary: {
          total_amount: currentTransaction.total_amount,
          paid_amount: currentTransaction.total_paid,
          remaining_amount: currentTransaction.total_amount - currentTransaction.total_paid,
          total_payments: currentTransaction.total_payments,
          completed_payments: currentTransaction.completed_payments,
          payment_status: currentTransaction.payment_status
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Ошибка при получении транзакции:', error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  },

  // Обновление статуса транзакции

  // Обновление статуса транзакции
  async update(req, res) {
    try {
      const transactionId = parseInt(req.params.id);
      const { status, admin_notes } = req.body;

      // Проверка прав доступа
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Валидация статуса
      const validStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Обновление транзакции
      const [result] = await pool.query(
        'UPDATE transactions SET status = ?, admin_notes = ? WHERE id = ?',
        [status, admin_notes, transactionId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Если транзакция одобрена, создаем запись в истории владения
      if (status === 'approved') {
        const [transaction] = await pool.query(
          'SELECT * FROM transactions WHERE id = ?',
          [transactionId]
        );

        if (transaction.length > 0) {
          // Проверяем, что у транзакции есть необходимые данные
          if (transaction[0].property_id && transaction[0].new_owner_id) {
            const newOwnership = {
              property_id: transaction[0].property_id,
              owner_id: transaction[0].new_owner_id,
              from_date: new Date(),
              to_date: null
            };

            await pool.query(
              'INSERT INTO ownership_history SET ?',
              [newOwnership]
            );
          } else {
            console.error('Transaction data incomplete for ownership history', transaction[0]);
            return res.status(500).json({
              message: 'Transaction data incomplete for ownership history'
            });
          }
        } else {
          console.error('Transaction not found after update', transactionId);
          return res.status(500).json({
            message: 'Transaction not found after update'
          });
        }
      }

      res.json({ success: true, message: 'Transaction updated successfully' });
    } catch (error) {
      console.error('Error updating transaction:', error);
      console.error('Request details:', {
        params: req.params,
        body: req.body,
        user: req.user
      });
      res.status(500).json({
        message: 'Internal server error',
        details: error.message
      });
    }
  },

  // Загрузка файлов к сделке
  async uploadFiles(req, res) {
    try {
      const transactionId = req.params.id;
      const files = req.files;
      const { type } = req.body; // 'single' или 'multiple'

      // Проверяем существование транзакции
      const [transaction] = await pool.query(
        'SELECT * FROM transactions WHERE id = ?',
        [transactionId]
      );

      if (transaction.length === 0) {
        // Удаляем загруженные файлы, если транзакция не найдена
        Object.values(files).flat().forEach(file => {
          fs.unlink(file.path).catch(console.error);
        });
        return res.status(404).json({ message: 'Транзакция не найдена' });
      }

      const savedFiles = [];

      if (type === 'single') {
        // Для одиночной загрузки
        const file = files.file[0]; // Ожидаем один файл с полем 'file'
        const category = req.body.category; // Категория файла (agreement, receipt, etc.)

        // Проверяем существование файлов той же категории
        const [existingFiles] = await pool.query(
          'SELECT * FROM transaction_files WHERE transaction_id = ? AND category = ?',
          [transactionId, category]
        );

        if (existingFiles.length > 0) {
          // Удаляем старый файл
          const oldFile = existingFiles[0];
          try {
            await fs.unlink(path.join(UPLOAD_PATH, oldFile.file_path));
            await pool.query('DELETE FROM transaction_files WHERE id = ?', [oldFile.id]);
          } catch (error) {
            console.error('Error deleting old file:', error);
          }
        }

        // Сохраняем новый файл
        const relativePath = path.relative(UPLOAD_PATH, file.path);
        const [result] = await pool.query(
          'INSERT INTO transaction_files (transaction_id, file_name, original_name, file_type, file_path, category) VALUES (?, ?, ?, ?, ?, ?)',
          [
            transactionId,
            file.filename,
            file.originalname,
            file.mimetype,
            `uploads/${file.filename}`,
            category
          ]
        );

        savedFiles.push({
          id: result.insertId,
          fileName: file.filename,
          originalName: file.originalname,
          type: file.mimetype,
          category: category
        });
      } else {
        // Для множественной загрузки
        for (const fieldName in files) {
          for (const file of files[fieldName]) {
            const relativePath = path.relative(UPLOAD_PATH, file.path);

            const [result] = await pool.query(
              'INSERT INTO transaction_files (transaction_id, file_name, original_name, file_type, file_path, category) VALUES (?, ?, ?, ?, ?, ?)',
              [
                transactionId,
                file.filename,
                file.originalname,
                file.mimetype,
                `uploads/${file.filename}`,
                fieldName
              ]
            );

            savedFiles.push({
              id: result.insertId,
              fileName: file.filename,
              originalName: file.originalname,
              type: file.mimetype,
              category: fieldName
            });
          }
        }
      }

      res.json({
        message: 'Файлы успешно загружены',
        files: savedFiles
      });
    } catch (error) {
      console.error('Ошибка при загрузке файлов:', error);
      // В случае ошибки пытаемся удалить загруженные файлы
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          fs.unlink(file.path).catch(console.error);
        });
      }
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  },

  // Получение файлов сделки
  async getFiles(req, res) {
    try {
      const [files] = await pool.query(
        'SELECT * FROM transaction_files WHERE transaction_id = ?',
        [req.params.id]
      );

      res.json(files);
    } catch (error) {
      console.error('Ошибка при получении файлов:', error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  },

  // Удаление файла
  async deleteFile(req, res) {
    try {
      const { id: transactionId, fileId } = req.params;

      const [files] = await pool.query(
        'SELECT * FROM transaction_files WHERE id = ? AND transaction_id = ?',
        [fileId, transactionId]
      );

      if (files.length === 0) {
        return res.status(404).json({ message: 'File not found' });
      }

      const file = files[0];
      const fullPath = path.join(UPLOAD_PATH, file.file_path);

      try {
        await fs.unlink(fullPath);
      } catch (error) {
        console.error('Error deleting file from disk:', error);
        // Продолжаем выполнение даже если файл не найден на диске
      }

      await pool.query(
        'DELETE FROM transaction_files WHERE id = ?',
        [fileId]
      );

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  async create(req, res) {
    try {
      const { property_id, new_owner_id, total_amount, witnesses } = req.body;

      // Проверяем, что свойство существует
      const property = getPropertyById(property_id);
      if (!property) {
        console.log('Property not found:', property_id);
        return res.status(404).json({ message: 'Property not found' });
      }

      // Получаем предыдущего владельца
      const previous_owner_id = await getPreviousOwner(property_id);

      // СОЗДАЕМ ТРАНЗАКЦИЮ СНАЧАЛА
      const [result] = await pool.query(
        `INSERT INTO transactions 
       (property_id, previous_owner_id, new_owner_id, status, total_amount, paid_amount)
       VALUES (?, ?, ?, 'pending', ?, 0)`,
        [property_id, previous_owner_id, new_owner_id, total_amount]
      );

      const transactionId = result.insertId;

      // ТЕПЕРЬ ДОБАВЛЯЕМ СВИДЕТЕЛЕЙ С ИСПОЛЬЗОВАНИЕМ transactionId
      if (witnesses) {
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();

          // Удаляем существующих свидетелей (на случай повторной попытки)
          await connection.query(
            'DELETE FROM transaction_witnesses WHERE transaction_id = ?',
            [transactionId]
          );

          // Обработка первого свидетеля
          if (witnesses.witness1) {
            const { name, cnic, phone } = witnesses.witness1;

            // ДОБАВЛЯЕМ СВИДЕТЕЛЯ НАПРЯМУЮ С transaction_id
            await connection.query(
              `INSERT INTO transaction_witnesses 
             (transaction_id, witness_type, name, cnic, phone) 
             VALUES (?, 'witness1', ?, ?, ?)`,
              [transactionId, name, cnic, phone || null]
            );
          }

          // Обработка второго свидетеля
          if (witnesses.witness2) {
            const { name, cnic, phone } = witnesses.witness2;

            // ДОБАВЛЯЕМ СВИДЕТЕЛЯ НАПРЯМУЮ С transaction_id
            await connection.query(
              `INSERT INTO transaction_witnesses 
             (transaction_id, witness_type, name, cnic, phone) 
             VALUES (?, 'witness2', ?, ?, ?)`,
              [transactionId, name, cnic, phone || null]
            );
          }

          await connection.commit();
        } catch (error) {
          await connection.rollback();
          throw error;
        } finally {
          connection.release();
        }
      }

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction_id: transactionId
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating transaction',
      });
    }
  },

  // Запрос на создание транзакции от пользователя
  async requestTransaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { property_id, new_owner_name, new_owner_cnic } = req.body;
      const previous_owner_id = req.user.id;

      // Проверяем существование объекта недвижимости
      const property = getPropertyById(property_id);
      if (!property) {
        return res.status(400).json({ message: 'Объект недвижимости не найден' });
      }

      // Проверяем наличие активных транзакций для данного объекта
      const [activeTransactions] = await pool.query(
        'SELECT id FROM transactions WHERE property_id = ? AND status = ?',
        [property_id, 'pending']
      );

      if (activeTransactions.length > 0) {
        return res.status(400).json({ message: 'Для данного объекта уже есть активная транзакция' });
      }

      // Проверяем или создаем нового владельца
      let newOwnerId;
      const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE cnic = ?',
        [new_owner_cnic]
      );

      if (existingUsers.length > 0) {
        newOwnerId = existingUsers[0].id;
      } else {
        // Создаем нового пользователя
        const [result] = await pool.query(
          'INSERT INTO users (name, cnic, status, role) VALUES (?, ?, ?, ?)',
          [new_owner_name, new_owner_cnic, 'active', 'user']
        );
        newOwnerId = result.insertId;
      }

      // Создаем новую транзакцию
      const [result] = await pool.query(
        'INSERT INTO transactions (property_id, previous_owner_id, new_owner_id, status) VALUES (?, ?, ?, ?)',
        [property_id, previous_owner_id, newOwnerId, 'pending']
      );

      res.status(201).json({
        message: 'Transaction request created successfully',
        transactionId: result.insertId
      });
    } catch (error) {
      console.error('Error creating transaction request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Получение сделок пользователя по конкретному объекту
  async getUserPropertyTransactions(req, res) {
    try {
      const userId = req.user.id;
      const propertyId = req.params.propertyId;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // Проверяем существование объекта недвижимости
      const property = getPropertyById(propertyId);
      if (!property) {
        return res.status(400).json({ message: 'Объект недвижимости не найден' });
      }

      let query = `
        SELECT t.*, 
          u1.name as previous_owner_name,
          u2.name as new_owner_name
        FROM transactions t
        LEFT JOIN users u1 ON t.previous_owner_id = u1.id
        LEFT JOIN users u2 ON t.new_owner_id = u2.id
        WHERE t.property_id = ?
        AND (t.previous_owner_id = ? OR t.new_owner_id = ?)
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [transactions] = await pool.query(query, [
        propertyId,
        userId,
        userId,
        parseInt(limit),
        offset
      ]);

      // Получаем общее количество
      const [totalRows] = await pool.query(
        'SELECT COUNT(*) as count FROM transactions WHERE property_id = ? AND (previous_owner_id = ? OR new_owner_id = ?)',
        [propertyId, userId, userId]
      );

      const total = totalRows[0].count;

      // Добавляем информацию о свойстве
      const enrichedTransactions = transactions.map(transaction => ({
        ...transaction,
        property_name: property.name,
        property_type: property.type
      }));

      res.json({
        transactions: enrichedTransactions,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Ошибка при получении сделок:', error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  },

  // Обновление статуса транзакции пользователем
  async updateUserTransaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status } = req.body;
      const transactionId = req.params.id;
      const userId = req.user.id;

      // Check if user is a participant in the transaction
      const [transaction] = await pool.query(
        'SELECT * FROM transactions WHERE id = ? AND (previous_owner_id = ? OR new_owner_id = ?)',
        [transactionId, userId, userId]
      );

      if (transaction.length === 0) {
        return res.status(404).json({ message: 'Transaction not found or you do not have permission to modify it' });
      }

      // Check current transaction status
      if (transaction[0].status !== 'pending') {
        return res.status(400).json({ message: 'Only transactions in pending status can be modified' });
      }

      // Update status
      const [result] = await pool.query(
        'UPDATE transactions SET status = ? WHERE id = ?',
        [status, transactionId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Failed to update transaction' });
      }

      res.json({ message: 'Transaction status updated successfully' });
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Создание платежа
async createPayment(req, res) {
    try {
        const transactionId = parseInt(req.params.id);
        const { amount, payment_date, payment_method, notes, receipt } = req.body;
        
        // Валидация обязательных полей
        if (!amount || !payment_date || !payment_method) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields' 
            });
        }
        
        // Проверка существования транзакции
        const [transaction] = await pool.query('SELECT * FROM transactions WHERE id = ?', [transactionId]);
        if (transaction.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Transaction not found' 
            });
        }
        
        // Проверка суммы платежа
        const totalAmount = transaction[0].total_amount;
        const [payments] = await pool.query('SELECT SUM(amount) as total_paid FROM transaction_payments WHERE transaction_id = ? AND status = "paid"', [transactionId]);
        const totalPaid = payments[0].total_paid || 0;
        const remainingAmount = totalAmount - totalPaid;
        
        if (amount > remainingAmount) {
            return res.status(400).json({ 
                success: false,
                message: 'Payment amount exceeds remaining amount',
                remaining_amount: remainingAmount
            });
        }
        
        let receiptFileId = null;
        
        // Обрабатываем квитанцию в base64 формате
        if (receipt && receipt.data && receipt.mime_type && receipt.file_name) {
            const { data, mime_type, file_name } = receipt;
            
            // Генерируем уникальное имя файла
            const fileExt = path.extname(file_name);
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${fileExt}`;
            
            // Декодируем base64 и сохраняем файл
            const buffer = Buffer.from(data.replace(/^.+;base64,/, ''), 'base64');
            
            // Определяем путь для сохранения
            const uploadDir = path.join(UPLOAD_PATH, 'transactions', 'receipts');
            await ensureDirectoryExists(uploadDir);
            
            const filePath = path.join(uploadDir, fileName);
            
            // Сохраняем файл на диск
            await fs.writeFile(filePath, buffer);
            
            // Сохраняем информацию о файле в базе
            const [fileResult] = await pool.query(
                `INSERT INTO transaction_files 
                 (transaction_id, file_name, original_name, file_type, file_path, category) 
                 VALUES (?, ?, ?, ?, ?, 'receipt')`,
                [
                    transactionId,
                    fileName,
                    file_name,
                    mime_type,
                    `transactions/receipts/${fileName}`
                ]
            );
            receiptFileId = fileResult.insertId;
        }
        
        // Создаем платеж
        const [result] = await pool.query(
            `INSERT INTO transaction_payments 
             (transaction_id, amount, payment_date, payment_method, notes, receipt_file_id, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [transactionId, amount, payment_date, payment_method, notes, receiptFileId]
        );
        
        // Обновляем сумму оплаченных платежей
        const [updatedTransaction] = await pool.query(
            `UPDATE transactions 
             SET paid_amount = COALESCE(paid_amount, 0) + ? 
             WHERE id = ?`,
            [amount, transactionId]
        );
        
        // Получаем созданный платеж
        const [payment] = await pool.query(
            `SELECT * 
             FROM transaction_payments 
             WHERE id = ?`,
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Payment created successfully',
            payment: payment[0]
        });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
},

  // Получение платежей по транзакции
  async getPayments(req, res) {
    try {
      const transactionId = req.params.id;

      const [payments] = await pool.query(`
        SELECT p.*, f.file_path, f.original_name
        FROM transaction_payments p
        LEFT JOIN transaction_files f ON p.receipt_file_id = f.id
        WHERE p.transaction_id = ?
        ORDER BY p.payment_date ASC
      `, [transactionId]);

      const [transaction] = await pool.query(
        'SELECT total_amount, paid_amount FROM transactions WHERE id = ?',
        [transactionId]
      );

      if (transaction.length === 0) {
        return res.status(404).json({ message: 'Транзакция не найдена' });
      }

      res.json({
        payments,
        total_amount: transaction[0].total_amount,
        paid_amount: transaction[0].paid_amount,
        remaining_amount: transaction[0].total_amount - transaction[0].paid_amount
      });
    } catch (error) {
      console.error('Ошибка при получении платежей:', error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  },

  // Обновление статуса платежа и загрузка квитанции
  async updatePayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, notes } = req.body;
      const transactionId = parseInt(req.params.id.toString(), 10);
      const paymentId = parseInt(req.params.paymentId.toString(), 10);

      if (isNaN(transactionId) || isNaN(paymentId)) {
        return res.status(400).json({ message: 'Invalid transaction or payment ID' });
      }

      // Проверяем существование платежа
      const [payment] = await pool.query(
        'SELECT * FROM transaction_payments WHERE id = ? AND transaction_id = ?',
        [paymentId, transactionId]
      );

      if (payment.length === 0) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      let receiptFileId = null;
      if (req.file) {
        // Сохраняем квитанцию в таблицу файлов
        const [fileResult] = await pool.query(
          'INSERT INTO transaction_files (transaction_id, file_name, original_name, file_type, file_path, category) VALUES (?, ?, ?, ?, ?, ?)',
          [transactionId, req.file.filename, req.file.originalname, req.file.mimetype, `uploads/${req.file.filename}`, 'receipt']
        );
        receiptFileId = fileResult.insertId;
      }

      // Обновляем статус платежа
      const [result] = await pool.query(
        'UPDATE transaction_payments SET status = ?, notes = ?, receipt_file_id = ? WHERE id = ? AND transaction_id = ?',
        [status, notes, receiptFileId, paymentId, transactionId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Если платеж подтвержден, обновляем сумму оплаты в транзакции
      if (status === 'paid') {
        await pool.query(`
          UPDATE transactions t
          SET t.paid_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM transaction_payments
            WHERE transaction_id = ? AND status = 'paid'
          )
          WHERE t.id = ?
        `, [transactionId, transactionId]);

        // Проверяем, все ли платежи оплачены
        const [payments] = await pool.query(
          'SELECT COUNT(*) as total, SUM(CASE WHEN status = "paid" THEN 1 ELSE 0 END) as paid FROM transaction_payments WHERE transaction_id = ?',
          [transactionId]
        );

        if (payments[0].total === payments[0].paid) {
          await pool.query(
            'UPDATE transactions SET payment_status = "completed" WHERE id = ?',
            [transactionId]
          );
        }
      }

      // Получаем обновленную информацию о платеже
      const [updatedPayment] = await pool.query(`
        SELECT p.*, f.file_path, f.original_name
        FROM transaction_payments p
        LEFT JOIN transaction_files f ON p.receipt_file_id = f.id
        WHERE p.id = ?
      `, [paymentId]);

      res.json({
        message: 'Payment updated successfully',
        payment: updatedPayment[0]
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * Получение истории транзакций объекта
   */
  async getObjectTransactions(req, res) {
    try {
      const { property_id } = req.query;

      // Проверяем валидацию
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Получаем текущего владельца из истории владения
      const [ownerHistory] = await pool.query(`
            SELECT oh.*, u.name as owner_name, u.cnic as owner_cnic
            FROM ownership_history oh
            LEFT JOIN users u ON oh.owner_id = u.id
            WHERE oh.property_id = ?
            ORDER BY oh.from_date DESC
            LIMIT 1
        `, [property_id]);

      // Получаем активные транзакции для данного объекта
      const [activeTransactions] = await pool.query(`
            SELECT 
                t.*,
                u1.name as previous_owner_name,
                u1.cnic as previous_owner_cnic,
                u2.name as new_owner_name,
                u2.cnic as new_owner_cnic
            FROM transactions t
            LEFT JOIN users u1 ON t.previous_owner_id = u1.id
            LEFT JOIN users u2 ON t.new_owner_id = u2.id
            WHERE t.property_id = ? AND t.status IN ('pending', 'approved')
            ORDER BY t.created_at DESC
        `, [property_id]);

      // Получаем историю владения
      const [ownershipHistory] = await pool.query(`
            SELECT 
                oh.*,
                u.name as owner_name,
                u.cnic as owner_cnic
            FROM ownership_history oh
            LEFT JOIN users u ON oh.owner_id = u.id
            WHERE oh.property_id = ?
            ORDER BY oh.from_date DESC
        `, [property_id]);

      // Получаем файлы и платежи только для активных транзакций
      const transactionIds = activeTransactions.map(t => t.id);
      let files = [], payments = [];

      if (transactionIds.length > 0) {
        // Получаем все файлы для транзакций
        const [transactionFiles] = await pool.query(`
                SELECT 
                    transaction_id,
                    original_name,
                    category,
                    created_at,
                    file_path
                FROM transaction_files
                WHERE transaction_id IN (?)
            `, [transactionIds]);

        files = transactionFiles;

        // Получаем все платежи с информацией о квитанциях
        const [transactionPayments] = await pool.query(`
                SELECT 
                    tp.*,
                    tf.original_name as receipt_name,
                    tf.created_at as receipt_upload_date,
                    tf.file_path as receipt_path
                FROM transaction_payments tp
                LEFT JOIN transaction_files tf ON tp.receipt_file_id = tf.id
                WHERE tp.transaction_id IN (?)
            `, [transactionIds]);

        payments = transactionPayments;
      }

      // Формируем ответ
      const response = {
        property_id,
        current_owner: ownerHistory.length > 0 ? {
          id: ownerHistory[0].owner_id,
          name: ownerHistory[0].owner_name,
          cnic: ownerHistory[0].owner_cnic,
          since: ownerHistory[0].from_date
        } : null,
        active_transactions: activeTransactions.map(t => ({
          id: t.id,
          status: t.status,
          new_owner: {
            name: t.new_owner_name,
            cnic: t.new_owner_cnic
          },
          created_at: t.created_at,
          total_amount: t.total_amount,
          paid_amount: t.paid_amount || 0,
          files: files
            .filter(f => f.transaction_id === t.id)
            .map(f => ({
              name: f.original_name,
              category: f.category,
              upload_date: f.created_at,
              path: f.file_path
            })),
          payments: payments
            .filter(p => p.transaction_id === t.id)
            .map(p => ({
              id: p.id,
              amount: p.amount,
              date: p.payment_date,
              status: p.status,
              method: p.payment_method,
              receipt: p.receipt_name ? {
                name: p.receipt_name,
                upload_date: p.receipt_upload_date,
                path: p.receipt_path
              } : null
            }))
        })),
        ownership_history: ownershipHistory.map(h => ({
          owner: {
            id: h.owner_id,
            name: h.owner_name,
            cnic: h.owner_cnic
          },
          from_date: h.from_date,
          to_date: h.to_date
        }))
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getObjectTransactions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
};

export default transactionController; 