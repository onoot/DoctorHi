
import { validationResult } from 'express-validator';
import pool from '../config/database.mjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';
import Units from '../models/Units.mjs';

// Возвращает относительный путь от UPLOAD_PATH
function getRelativePath(absolutePath) {
  if (!absolutePath) return '';
  // Используем импортированный path
  const rel = path.relative(UPLOAD_PATH, absolutePath).replace(/\\/g, '/');
  return rel;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOAD_PATH = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.join(__dirname, 'uploads');

const initializeUploadDirectories = async () => {
  try {
    await fs.mkdir(path.join(UPLOAD_PATH, 'transactions'), { recursive: true });
    await fs.mkdir(path.join(UPLOAD_PATH, 'transactions', 'agreements'), { recursive: true });
    await fs.mkdir(path.join(UPLOAD_PATH, 'transactions', 'receipts'), { recursive: true });
    await fs.mkdir(path.join(UPLOAD_PATH, 'transactions', 'documents'), { recursive: true });
    console.log('Upload directories created successfully at:', UPLOAD_PATH);
    return UPLOAD_PATH;
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw error;
  }
};

export { UPLOAD_PATH, initializeUploadDirectories };
// Создаем экспортный промис для инициализации
export const uploadInit = initializeUploadDirectories().catch(err => {
  console.error('Failed to initialize upload directories. The application may not work correctly with file uploads.', err);
  return null;
});

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

const units = async ()=>{
  try{
    return await Units.getAll()
  }catch(e){
    console.log(e);
    throw e;
  }
}

// Обновленная функция для поиска объекта недвижимости по ID
async function getPropertyById(propertyId) {
  try {
    // Используем модель Unit для поиска по original_id
    // Предполагается, что `property_id` в таблице `transactions` соответствует `original_id` в таблице `units`
    const unit = await Unit.findByOriginalIdAndCategory(propertyId, ''); // Второй параметр category можно опустить, если ищем по всем категориям
    // Или, если в вашей модели нет метода findByOriginalIdAndCategory, создайте его или используйте findById, если propertyId соответствует уникальному ID
    if (unit) {
      // Возвращаем объект в формате, ожидаемом контроллером
      return {
        id: unit.original_id, // или unit.id, в зависимости от того, что хранится в transactions
        name: unit.name,
        type: unit.type
        // area: unit.area // опционально
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching property by ID:', error);
    return null; // или пробросить ошибку дальше
  }
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

  // Получение детальной информации о конкретной транзакции пользователя
  async getTransactionDetails(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ isAuthenticated: false, message: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const transactionId = parseInt(req.params.id);
      const userId = decoded.id;

      // Проверяем, что транзакция принадлежит пользователю
      const [transactionCheck] = await pool.query(
        'SELECT id FROM transactions WHERE id = ? AND (previous_owner_id = ? OR new_owner_id = ?)',
        [transactionId, userId, userId]
      );

      if (transactionCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this transaction'
        });
      }

      // Получаем основную информацию о транзакции
      const [transactions] = await pool.query(`
            SELECT t.*, 
                   u1.name as previous_owner_name,
                   u2.name as new_owner_name
            FROM transactions t
            LEFT JOIN users u1 ON t.previous_owner_id = u1.id
            LEFT JOIN users u2 ON t.new_owner_id = u2.id
            WHERE t.id = ?
        `, [transactionId]);

      if (transactions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const transaction = transactions[0];

      // Получаем документы транзакции
      const [documents] = await pool.query(`
            SELECT * 
            FROM transaction_files 
            WHERE transaction_id = ?
        `, [transactionId]);

      // Получаем свидетелей транзакции
      const [witnesses] = await pool.query(`
            SELECT witness_type, name, cnic, phone 
            FROM transaction_witnesses 
            WHERE transaction_id = ?
        `, [transactionId]);

      // Преобразуем массив свидетелей в объект
      const formattedWitnesses = witnesses.reduce((acc, witness) => {
        acc[witness.witness_type] = {
          name: witness.name,
          cnic: witness.cnic,
          phone: witness.phone
        };
        return acc;
      }, {});

      // Получаем платежи по транзакции
      const [payments] = await pool.query(`
            SELECT p.*, f.file_path, f.original_name
            FROM transaction_payments p
            LEFT JOIN transaction_files f ON p.receipt_file_id = f.id
            WHERE p.transaction_id = ?
            ORDER BY p.payment_date ASC
        `, [transactionId]);

      // Получаем историю владения для свойства
      const [ownershipHistory] = await pool.query(`
            SELECT oh.*, u.name as owner_name, u.cnic as owner_cnic
            FROM ownership_history oh
            LEFT JOIN users u ON oh.owner_id = u.id
            WHERE oh.property_id = ?
            ORDER BY oh.from_date DESC
        `, [transaction.property_id]);

      // Получаем информацию о свойстве
      const property = getPropertyById(transaction.property_id);

      // Формируем ответ
      res.json({
        success: true,
        transaction: {
          id: transaction.id,
          property_id: transaction.property_id,
          property_name: property ? property.name : 'Unknown Property',
          property_type: property ? property.type : 'unknown',
          previous_owner_id: transaction.previous_owner_id,
          previous_owner_name: transaction.previous_owner_name,
          new_owner_id: transaction.new_owner_id,
          new_owner_name: transaction.new_owner_name,
          status: transaction.status,
          total_amount: transaction.total_amount,
          paid_amount: transaction.paid_amount,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
          files: documents,
          witnesses: formattedWitnesses,
          payments: payments
        },
        ownership_history: ownershipHistory
      });

    } catch (error) {
      console.error('Error getting transaction details:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  // Получение сделок пользователя
  async getUserTransactions(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const authHeader = req.headers.authorization;

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id


      const offset = (page - 1) * limit;

      const status = 'approved'

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

      // Внутри async getAll(req, res)
      const enrichedTransactions = await Promise.all(transactions.map(async (transaction) => {
        // Используем await для получения данных о свойстве
        const property = await getPropertyById(transaction.property_id);
        return {
          ...transaction,
          property_name: property ? property.name : 'Unknown Property',
          property_type: property ? property.type : 'unknown'
        };
      }));

      res.json({
        success: true,
        transactions: enrichedTransactions,
        total,
        page: parseInt(page),
        pages: totalPages
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
 * Получение детальной информации о транзакции для клиента
 * Включает рассчитанный график платежей
 */
async getUserTransactionDetails(req, res) {
  try {
    const userId = req.user.id; // Получаем ID пользователя из токена (после auth)
    const transactionId = req.params.id;

    // 1. Получаем транзакцию с проверкой принадлежности пользователю
    // Предполагается, что модель Transaction имеет метод findByIdAndUser
    const transaction = await Transaction.findByIdAndUser(transactionId, userId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied'
      });
    }

    // 2. Получаем совершенные платежи из БД
    const payments = await Payment.findByTransactionId(transactionId);

    // 3. Рассчитываем полный график платежей
    let fullPaymentSchedule = [];

    if (transaction.payment_type === 'full') {
      // Для полной оплаты график состоит из одного платежа
      fullPaymentSchedule = [{
        installment: 1,
        amount: transaction.total_amount,
        due_date: transaction.full_payment_deadline,
        status: payments.length > 0 ? 'paid' : 'pending', // Упрощение
        payment_id: payments.length > 0 ? payments[0].id : null,
        payment_date: payments.length > 0 ? payments[0].payment_date : null,
        payment_method: payments.length > 0 ? payments[0].payment_method : null,
        // ... другие поля платежа
      }];
    } else if (transaction.payment_type === 'schedule') {
      // Для оплаты по расписанию рассчитываем график
      if (transaction.payment_schedule) {
        // Если график уже сохранен в БД (JSON)
        fullPaymentSchedule = transaction.payment_schedule;
      } else {
        // Если нужно рассчитать "на лету"
        // Вам понадобится функция, аналогичная calculateScheduleLocally из JS, но на сервере
        // Например: import { calculateSchedule } from '../utils/scheduleCalculator.mjs';
        // fullPaymentSchedule = calculateSchedule(transaction);
        
        // Пока что просто возьмем платежи из БД как есть и добавим их в график
        // Это временное решение, пока логика расчета не перенесена на сервер
        fullPaymentSchedule = payments.map(p => ({
          installment: p.installment_number || p.id, // Предполагаем, что есть поле installment_number
          amount: p.amount,
          due_date: p.due_date || p.payment_date, // Предполагаем, что есть поле due_date
          status: p.status,
          payment_id: p.id,
          payment_date: p.payment_date,
          payment_method: p.payment_method,
        }));
      }

      // Обогащаем рассчитанный график данными из совершенных платежей
      fullPaymentSchedule = fullPaymentSchedule.map(scheduleItem => {
        // Ищем соответствующий платеж в списке совершенных
        const paidPayment = payments.find(p => 
          // Сравниваем по номеру платежа или дате/сумме, в зависимости от структуры БД
          p.installment_number === scheduleItem.installment ||
          (new Date(p.due_date).getTime() === new Date(scheduleItem.due_date).getTime() && 
           parseFloat(p.amount).toFixed(2) === parseFloat(scheduleItem.amount).toFixed(2))
        );

        if (paidPayment) {
          return {
            ...scheduleItem,
            status: paidPayment.status, // Может быть 'paid' или 'confirmed'
            payment_id: paidPayment.id,
            payment_date: paidPayment.payment_date,
            payment_method: paidPayment.payment_method,
            // ... другие поля из платежа
          };
        }
        // Если платеж не найден, оставляем статус из графика (например, 'pending')
        return scheduleItem;
      });
    }

    // 4. Получаем файлы транзакции (документы)
    const files = await TransactionFile.findByTransactionId(transactionId);

    // 5. Получаем свидетелей транзакции
    const witnesses = await TransactionWitness.findByTransactionId(transactionId);

    res.json({
      success: true,
      transaction: {
        ...transaction, // Основные данные транзакции
        files, // Документы
        witnesses, // Свидетели
      },
      payments: fullPaymentSchedule, // Передаем ПОЛНЫЙ график, включая совершенные
      // ownership_history: ownershipHistory 
    });

  } catch (error) {
    console.error('Error getting user transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
},

  async deletePayment(req, res) {
    try {
      const transactionId = parseInt(req.params.id);
      const paymentId = parseInt(req.params.paymentId);

      // Удаляем платеж из базы данных
      const [result] = await pool.query(
        'DELETE FROM transaction_payments WHERE id = ? AND transaction_id = ?',
        [paymentId, transactionId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Обновляем сумму оплаченных платежей для транзакции
      const [payments] = await pool.query(
        'SELECT SUM(amount) AS total_paid FROM transaction_payments WHERE transaction_id = ?',
        [transactionId]
      );

      const paidAmount = payments[0].total_paid || 0;

      await pool.query(
        'UPDATE transactions SET paid_amount = ? WHERE id = ?',
        [paidAmount, transactionId]
      );

      res.json({
        success: true,
        message: 'Payment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting payment'
      });
    }
  },

  async getPaymentById(req, res) {
    try {
      const transactionId = parseInt(req.params.id);
      const paymentId = parseInt(req.params.paymentId);

      // Получаем платеж по ID
      const [payment] = await pool.query(
        'SELECT * FROM transaction_payments WHERE id = ? AND transaction_id = ?',
        [paymentId, transactionId]
      );

      if (!payment || payment.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.json({
        success: true,
        payment: payment[0]
      });
    } catch (error) {
      console.error('Error getting payment by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting payment'
      });
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
          previous_owner_name: transaction.previous_owner_name || 'N/A',
          new_owner_id: transaction.new_owner_id,
          new_owner_name: transaction.new_owner_name || 'ERROR',
          status: transaction.status,
          admin_notes: transaction.admin_notes,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at
        };
      });
      const properties = await units()
      res.json({
        success: true,
        success: true,
        transactions: enrichedTransactions,
        total,
        page: parseInt(page),
        properties: properties,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  // Обновление примечаний администратора для транзакции
async updateAdminNotes(req, res) {
  try {
    const transactionId = parseInt(req.params.id);
    const { admin_notes } = req.body; // admin_notes может быть null или строкой

    // Проверка прав доступа
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!transactionId) {
      return res.status(400).json({ success: false, message: 'Transaction ID is required' });
    }

    // Проверяем, существует ли колонка admin_notes, и добавляем её, если нет
    try {
      await pool.query(`
        ALTER TABLE transactions 
        ADD COLUMN admin_notes TEXT NULL
      `);
      console.log('[TRANSACTION] Added admin_notes column to transactions table');
    } catch (alterError) {
      // ER_DUP_FIELDNAME означает, что колонка уже существует - это нормально
      if (alterError.code !== 'ER_DUP_FIELDNAME') {
        console.error('[TRANSACTION] Error ensuring admin_notes column exists:', alterError);
        // Не прерываем выполнение, так как колонка может уже существовать
      }
    }

    // Обновление примечаний администратора
    const [result] = await pool.query(
      'UPDATE transactions SET admin_notes = ? WHERE id = ?',
      [admin_notes, transactionId] // admin_notes может быть null
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Administrator notes updated successfully' });
  } catch (error) {
    console.error('Error updating admin notes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error.message
    });
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

      if (transactions.length === 0) {
        return res.status(404).json({ success: false, message: 'Транзакция не найдена' });
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
        success: true,
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
      res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  },

  // Обновление статуса транзакции
async update(req, res) {
  try {
    const transactionId = parseInt(req.params.id);
    const { status, reason } = req.body; // reason вместо admin_notes

    // Проверка прав доступа
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Валидация статуса
    const validStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Сначала добавим колонку admin_notes если её нет
    try {
      await pool.query(`
        ALTER TABLE transactions 
        ADD COLUMN admin_notes TEXT NULL
      `);
      console.log('Added admin_notes column to transactions table');
    } catch (e) {
      // Колонка уже существует - это нормально
      if (e.code !== 'ER_DUP_FIELDNAME') {
        console.error('Error adding admin_notes column:', e);
      }
    }

    // Обновление транзакции
    const [result] = await pool.query(
      'UPDATE transactions SET status = ?, admin_notes = ? WHERE id = ?',
      [status, reason || null, transactionId] // reason вместо admin_notes
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
          
          // Здесь должен быть код для вставки в ownership_history
          // await pool.query('INSERT INTO ownership_history SET ?', [newOwnership]);
        } else {
          console.error('Transaction data incomplete for ownership history', transaction[0]);
          // Не возвращаем ошибку, просто логируем
        }
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

  async uploadFiles(req, res) {
    try {
      const transactionId = req.params.id;
      const filesArray = req.files || [];
      const { type } = req.body; // 'single' или 'multiple'
      let category = req.body.category; // 👈 КЛЮЧЕВОЙ ПАРАМЕТР — БЕРЕМ ЕГО ИЗ BODY

      const files = {};
      for (const file of filesArray) {
        if (!files[file.fieldname]) files[file.fieldname] = [];
        files[file.fieldname].push(file);
      }


      // Проверяем существование транзакции
      const [transaction] = await pool.query(
        'SELECT * FROM transactions WHERE id = ?',
        [transactionId]
      );

      if (transaction.length === 0) {
        Object.values(files).flat().forEach(file => {
          fs.unlink(file.path).catch(console.error);
        });
        return res.status(404).json({
          message: 'Transaction not found'
        });
      }

      const savedFiles = [];

      const allowedCategories = ['agreement', 'receipt', 'video', 'proof_documents'];

      if (!allowedCategories.includes(category)) {
        category = 'proof_documents';
      }

      function makeFullFileName(originalName, userLogin) {
        const ext = path.extname(originalName);
        const base = path.basename(originalName, ext);
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.getHours().toString().padStart(2, '0') + '-' + now.getMinutes().toString().padStart(2, '0');
        return `${base}_${userLogin}_${dateStr}_${timeStr}${ext}`;
      }

      if (type === 'single') {
        const file = files.file[0]; // Один файл в поле 'file'
        let userLogin = req.user?.login || 'unknown';
        const fullFileName = makeFullFileName(file.originalname, userLogin);
        const newAbsPath = path.join(path.dirname(file.path), fullFileName);
        await fs.rename(file.path, newAbsPath);

        const [result] = await pool.query(
          'INSERT INTO transaction_files (transaction_id, file_name, original_name, file_type, file_path, category) VALUES (?, ?, ?, ?, ?, ?)',
          [
            transactionId,
            fullFileName,
            file.originalname,
            file.mimetype,
            getRelativePath(newAbsPath),
            category // 👈 ИСПОЛЬЗУЕМ category ИЗ req.body
          ]
        );

        if (category === 'receipt') {
          const [payments] = await pool.query(
            'SELECT id FROM transaction_payments WHERE transaction_id = ? AND (receipt_file_id IS NULL OR receipt_file_id = 0) ORDER BY id DESC LIMIT 1',
            [transactionId]
          );
          if (payments.length > 0) {
            await pool.query('UPDATE transaction_payments SET receipt_file_id = ? WHERE id = ?', [result.insertId, payments[0].id]);
          }
        }

        savedFiles.push({
          id: result.insertId,
          fileName: fullFileName,
          originalName: file.originalname,
          type: file.mimetype,
          category: category
        });

      } else {
        // Множественная загрузка — теперь ВСЕ файлы получают ОДНУ КАТЕГОРИЮ из req.body.category
        for (const fieldName in files) {
          for (const file of files[fieldName]) {
            let userLogin = req.user?.login || 'unknown';
            const fullFileName = makeFullFileName(file.originalname, userLogin);
            const newAbsPath = path.join(path.dirname(file.path), fullFileName);
            await fs.rename(file.path, newAbsPath);

            const [result] = await pool.query(
              'INSERT INTO transaction_files (transaction_id, file_name, original_name, file_type, file_path, category) VALUES (?, ?, ?, ?, ?, ?)',
              [
                transactionId,
                fullFileName,
                file.originalname,
                file.mimetype,
                getRelativePath(newAbsPath),
                category // 👈 ВСЕ ФАЙЛЫ ПОЛУЧАЮТ ОДНУ КАТЕГОРИЮ — ИЗ req.body
              ]
            );

            if (category === 'receipt') {
              const [payments] = await pool.query(
                'SELECT id FROM transaction_payments WHERE transaction_id = ? AND (receipt_file_id IS NULL OR receipt_file_id = 0) ORDER BY id DESC LIMIT 1',
                [transactionId]
              );
              if (payments.length > 0) {
                await pool.query('UPDATE transaction_payments SET receipt_file_id = ? WHERE id = ?', [result.insertId, payments[0].id]);
              }
            }

            savedFiles.push({
              id: result.insertId,
              fileName: fullFileName,
              originalName: file.originalname,
              type: file.mimetype,
              category: category
            });
          }
        }
      }

      res.json({
        success: true,
        message: 'Files uploaded successfully',
        files: savedFiles
      });

    } catch (error) {
      console.error('Error uploading files:', error);
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          fs.unlink(file.path).catch(console.error);
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: error.message
      });
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
      res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
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

      res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

// Создание новой транзакции
async create(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // === НОВАЯ ЛОГИКА: Получение данных типа оплаты ===
    const { 
      property_id, 
      new_owner_id, 
      total_amount, 
      witnesses, 
      admin_notes,
      payment_type, // 'full' или 'schedule'
      full_payment_deadline, // для 'full'
      schedule_payment_day, // для 'schedule' (число 1-31)
      min_payment_amount // для 'schedule'
      // payment_schedule // если отправляете рассчитанное расписание
    } = req.body;
    // === КОНЕЦ НОВОЙ ЛОГИКИ ===

    // Валидация входных данных
    if (!property_id || !new_owner_id || !total_amount || !witnesses || !payment_type) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: property_id, new_owner_id, total_amount, witnesses, payment_type' 
      });
    }

    // Валидация типа оплаты
    if (payment_type !== 'full' && payment_type !== 'schedule') {
       await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment_type. Must be "full" or "schedule".' 
      });
    }

    if (payment_type === 'full' && !full_payment_deadline) {
       await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'full_payment_deadline is required for full payment type.' 
      });
    }

    if (payment_type === 'schedule') {
      if (!schedule_payment_day || schedule_payment_day < 1 || schedule_payment_day > 31) {
         await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'Valid schedule_payment_day (1-31) is required for schedule payment type.' 
        });
      }
      if (!min_payment_amount || min_payment_amount <= 0) {
         await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'Valid min_payment_amount is required for schedule payment type.' 
        });
      }
      if (parseFloat(min_payment_amount) > parseFloat(total_amount)) {
         await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'min_payment_amount cannot be greater than total_amount.' 
        });
      }
    }

    // Проверяем, существуют ли необходимые колонки, и добавляем их, если нет
    try {
      await connection.query(`
        ALTER TABLE transactions 
        ADD COLUMN payment_type ENUM('full', 'schedule') NOT NULL DEFAULT 'full'
      `);
      console.log('[TRANSACTION] Ensured payment_type column exists');
    } catch (alterError) {
      if (alterError.code !== 'ER_DUP_FIELDNAME') {
        console.error('[TRANSACTION] Error ensuring payment_type column exists:', alterError);
      }
    }

    try {
      await connection.query(`
        ALTER TABLE transactions 
        ADD COLUMN full_payment_deadline DATE NULL
      `);
      console.log('[TRANSACTION] Ensured full_payment_deadline column exists');
    } catch (alterError) {
      if (alterError.code !== 'ER_DUP_FIELDNAME') {
        console.error('[TRANSACTION] Error ensuring full_payment_deadline column exists:', alterError);
      }
    }

    try {
      await connection.query(`
        ALTER TABLE transactions 
        ADD COLUMN schedule_payment_day TINYINT UNSIGNED NULL
      `);
      console.log('[TRANSACTION] Ensured schedule_payment_day column exists');
    } catch (alterError) {
      if (alterError.code !== 'ER_DUP_FIELDNAME') {
        console.error('[TRANSACTION] Error ensuring schedule_payment_day column exists:', alterError);
      }
    }

    // Убедимся, что admin_notes колонка существует
    try {
      await connection.query(`
        ALTER TABLE transactions 
        ADD COLUMN admin_notes TEXT NULL
      `);
      console.log('[TRANSACTION] Ensured admin_notes column exists');
    } catch (alterError) {
      if (alterError.code !== 'ER_DUP_FIELDNAME') {
        console.error('[TRANSACTION] Error ensuring admin_notes column exists:', alterError);
      }
    }

    // === НОВАЯ ЛОГИКА: Подготовка данных для вставки ===
    const transactionData = {
      property_id,
      new_owner_id: parseInt(new_owner_id),
      total_amount: parseFloat(total_amount),
      status: 'pending',
      admin_notes: admin_notes || null,
      payment_type: payment_type,
      full_payment_deadline: payment_type === 'full' ? full_payment_deadline : null,
      schedule_payment_day: payment_type === 'schedule' ? parseInt(schedule_payment_day) : null,
      min_payment_amount: payment_type === 'schedule' ? parseFloat(min_payment_amount) : null,
      // payment_schedule: payment_type === 'schedule' ? JSON.stringify(payment_schedule) : null,
      payment_status: 'not_started', // Инициализируем статус платежа
      paid_amount: 0.00 // Инициализируем оплаченную сумму
    };
    // === КОНЕЦ НОВОЙ ЛОГИКИ ===

    // Создаем запись транзакции
    const [transactionResult] = await connection.execute(
      `INSERT INTO transactions 
       (property_id, new_owner_id, total_amount, status, admin_notes, 
        payment_type, full_payment_deadline, schedule_payment_day, min_payment_amount, 
        payment_status, paid_amount, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        transactionData.property_id,
        transactionData.new_owner_id,
        transactionData.total_amount,
        transactionData.status,
        transactionData.admin_notes,
        transactionData.payment_type,
        transactionData.full_payment_deadline,
        transactionData.schedule_payment_day,
        transactionData.min_payment_amount,
        transactionData.payment_status,
        transactionData.paid_amount
      ]
    );

    const transactionId = transactionResult.insertId;

    // Сохраняем данные свидетелей
    if (witnesses.witness1) {
      await connection.execute(
        `INSERT INTO transaction_witnesses 
         (transaction_id, name, cnic, phone, witness_number) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          transactionId,
          witnesses.witness1.name,
          witnesses.witness1.cnic,
          witnesses.witness1.phone || null,
          1
        ]
      );
    }

    if (witnesses.witness2) {
      await connection.execute(
        `INSERT INTO transaction_witnesses 
         (transaction_id, name, cnic, phone, witness_number) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          transactionId,
          witnesses.witness2.name,
          witnesses.witness2.cnic,
          witnesses.witness2.phone || null,
          2
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transactionId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating transaction:', error);
    // Более информативная ошибка для клиента
    res.status(500).json({ 
      success: false,
      message: 'Internal server error while creating transaction',
      // details: process.env.NODE_ENV === 'development' ? error.message : undefined // Только в dev
    });
  } finally {
    connection.release();
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
        return res.status(400).json({ success: false, message: 'Объект недвижимости не найден' });
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
        success: true,
        transactions: enrichedTransactions,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Ошибка при получении сделок:', error);
      return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  },

  // Создание платежа
  async createPayment(req, res) {
    try {
      const transactionId = parseInt(req.params.id.toString(), 10);
      if (isNaN(transactionId)) {
        return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
      }
      let { amount, payment_date, payment_method, notes } = req.body || {};
      // Получаем файл, если он был загружен
      let receiptFile = null;
      if (req.files && req.files.receipt && req.files.receipt.length > 0) {
        receiptFile = req.files.receipt[0];
      }
      // Если дата не передана — ставим текущую
      if (!payment_date) {
        payment_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
      // Проверка обязательных полей
      if (!amount || !payment_method) {
        return res.status(400).json({
          message: 'Missing required fields: amount, payment_method'
        });
      }

      // Проверяем существование транзакции
      const [transactions] = await pool.query(`
      SELECT t.*,
        COALESCE(SUM(CASE WHEN tp.status IN ('pending', 'paid') THEN tp.amount ELSE 0 END), 0) as total_allocated,
        t.total_amount
      FROM transactions t
      LEFT JOIN transaction_payments tp ON t.id = tp.transaction_id
      WHERE t.id = ?
      GROUP BY t.id
    `, [transactionId]);

      if (transactions.length === 0) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      const transaction = transactions[0];
      const totalAmount = parseFloat(transaction.total_amount);
      const totalAllocated = parseFloat(transaction.total_allocated);
      const remainingUnallocated = totalAmount - totalAllocated;
      const attemptedAmount = parseFloat(amount);

      // Проверка, не превышает ли сумма платежа оставшуюся сумму
      if (attemptedAmount > remainingUnallocated) {
        return res.status(400).json({
          message: 'Payment amount exceeds remaining unallocated amount',
          total_amount: totalAmount,
          total_allocated: totalAllocated,
          remaining_unallocated: remainingUnallocated,
          attempted: attemptedAmount
        });
      }

      // Обрабатываем квитанцию, если файл был загружен
      let receiptFileId = null;
      if (receiptFile) {
        // ИСПРАВЛЕНО: сохраняем относительный путь
        const relativePath = getRelativePath(receiptFile.path);

        const [result] = await pool.query(
          `INSERT INTO transaction_files 
         (transaction_id, file_name, original_name, file_type, file_path, category) 
         VALUES (?, ?, ?, ?, ?, ?)`,
          [
            transactionId,
            receiptFile.filename,
            receiptFile.originalname,
            receiptFile.mimetype,
            relativePath, // ИСПОЛЬЗУЕМ ОТНОСИТЕЛЬНЫЙ ПУТЬ
            'receipt'
          ]
        );
        receiptFileId = result.insertId;
      }

      // Создаем платеж
      const [result] = await pool.query(
        `INSERT INTO transaction_payments (
        transaction_id, amount, payment_date, payment_method, notes, receipt_file_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [
          transactionId,
          amount,
          payment_date,
          payment_method,
          notes || null,
          receiptFileId
        ]
      );

      // Обновляем статус транзакции, если это первый платеж
      if (!transaction.payment_status || transaction.payment_status === 'not_started') {
        await pool.query(
          'UPDATE transactions SET payment_status = "in_progress" WHERE id = ?',
          [transactionId]
        );
      }

      // Получаем созданный платеж с информацией о квитанции
      const [payment] = await pool.query(`
      SELECT p.*, f.file_path, f.original_name
      FROM transaction_payments p
      LEFT JOIN transaction_files f ON p.receipt_file_id = f.id
      WHERE p.id = ?`, [result.insertId]);

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        payment: payment[0]
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({
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
        success: true,
        payments,
        total_amount: transaction[0].total_amount,
        paid_amount: transaction[0].paid_amount,
        remaining_amount: transaction[0].total_amount - transaction[0].paid_amount
      });
    } catch (error) {
      console.error('Ошибка при получении платежей:', error);
      res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  },

  async updatePayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, notes, receipt_file_id } = req.body;
      const transactionId = parseInt(req.params.id.toString(), 10);
      const paymentId = parseInt(req.params.paymentId.toString(), 10);

      if (isNaN(transactionId) || isNaN(paymentId)) {
        return res.status(400).json({ success: false, message: 'Invalid transaction or payment ID' });
      }

      // Проверяем существование платежа
      const [payment] = await pool.query(
        'SELECT * FROM transaction_payments WHERE id = ? AND transaction_id = ?',
        [paymentId, transactionId]
      );

      if (payment.length === 0) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Определяем, что обновлять
      const updates = [];
      const values = [];

      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }

      if (notes !== undefined) {
        updates.push('notes = ?');
        values.push(notes);
      }

      let receiptFileId = payment[0].receipt_file_id; // сохраняем текущее значение

      if (req.file) {
        // Загружен новый файл
        const [fileResult] = await pool.query(
          'INSERT INTO transaction_files (transaction_id, file_name, original_name, file_type, file_path, category) VALUES (?, ?, ?, ?, ?, ?)',
          [transactionId, req.file.filename, req.file.originalname, req.file.mimetype, `uploads/${req.file.filename}`, 'receipt']
        );
        receiptFileId = fileResult.insertId;
        updates.push('receipt_file_id = ?');
        values.push(receiptFileId);
      } else if (receipt_file_id !== undefined) {
        // Передан ID существующего файла
        receiptFileId = receipt_file_id;
        updates.push('receipt_file_id = ?');
        values.push(receiptFileId);
      }

      if (updates.length === 0) {
        return res.json({
          success: true,
          message: 'No changes to update',
          payment: payment[0]
        });
      }

      // Выполняем обновление
      values.push(paymentId, transactionId);
      const [result] = await pool.query(
        `UPDATE transaction_payments SET ${updates.join(', ')} WHERE id = ? AND transaction_id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Если статус = paid — обновляем сумму в транзакции
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

      // Получаем обновлённый платеж
      const [updatedPayment] = await pool.query(`
      SELECT p.*, f.file_path, f.original_name
      FROM transaction_payments p
      LEFT JOIN transaction_files f ON p.receipt_file_id = f.id
      WHERE p.id = ?
    `, [paymentId]);

      res.json({
        success: true,
        message: 'Payment updated successfully',
        payment: updatedPayment[0]
      });

    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
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