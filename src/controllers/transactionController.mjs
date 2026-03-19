// controllers/transactionController.mjs
import { validationResult } from 'express-validator';
import pool from '../config/database.mjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Константы
const UPLOAD_PATH = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.join(__dirname, '../uploads');

class TransactionController {
  // Вспомогательные методы
  
  /**
   * Возвращает относительный путь от UPLOAD_PATH
   */
  static getRelativePath(absolutePath) {
    if (!absolutePath) return '';
    const rel = path.relative(UPLOAD_PATH, absolutePath).replace(/\\/g, '/');
    return rel;
  }
  
  /**
   * Генерация имени файла
   */
  static generateFileName(originalName, category, userLogin) {
    const date = new Date().toISOString().split('T')[0];
    const ext = path.extname(originalName);
    const categoryNames = {
      agreement: 'Agreement',
      receipt: 'Receipt',
      proof_documents: 'Document',
      video: 'Video'
    };
    
    return `${categoryNames[category] || 'File'}_${userLogin}_${date}${ext}`;
  }
  
  /**
   * Получение предыдущего владельца из истории владения
   */
  static async getPreviousOwner(propertyId) {
    const [owners] = await pool.query(`
      SELECT owner_id 
      FROM ownership_history 
      WHERE property_id = ? 
      AND (to_date IS NULL OR to_date > NOW())
      ORDER BY from_date DESC 
      LIMIT 1
    `, [propertyId]);
    
    return owners.length > 0 ? owners[0].owner_id : null;
  }
  
  /**
   * Расчет графика платежей
   */
  static calculatePaymentSchedule(principal, months, monthlyRate, dayOfMonth, scheduleType, initialPayment) {
    let rows = [];
    let balance = principal;
    const today = new Date();
    
    if (scheduleType === 'equal_installments') {
      let monthlyPayment = 0;
      if (monthlyRate === 0) {
        monthlyPayment = principal / months;
      } else {
        const r = monthlyRate;
        monthlyPayment = principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
      }
      
      for (let i = 1; i <= months; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, Math.min(dayOfMonth, 28));
        const interest = Number((balance * monthlyRate).toFixed(2));
        let principalPayment = Number((monthlyPayment - interest).toFixed(2));
        if (i === months) {
          principalPayment = Number(balance.toFixed(2));
        }
        const paymentAmount = Number((principalPayment + interest).toFixed(2));
        balance = Number((balance - principalPayment).toFixed(2));
        rows.push({
          installment: i,
          due_date: date.toISOString().split('T')[0],
          amount: paymentAmount,
          principal: principalPayment,
          interest,
          balance,
          total_amount: paymentAmount + initialPayment
        });
      }
    } else if (scheduleType === 'decreasing_fixed') {
      const fixedPrincipal = Number((principal / months).toFixed(2));
      for (let i = 1; i <= months; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, Math.min(dayOfMonth, 28));
        const interest = Number((balance * monthlyRate).toFixed(2));
        let principalPayment = fixedPrincipal;
        if (i === months) principalPayment = Number(balance.toFixed(2));
        const paymentAmount = Number((principalPayment + interest).toFixed(2));
        balance = Number((balance - principalPayment).toFixed(2));
        rows.push({
          installment: i,
          due_date: date.toISOString().split('T')[0],
          amount: paymentAmount,
          principal: principalPayment,
          interest,
          balance,
          total_amount: paymentAmount + initialPayment
        });
      }
    }
    
    return rows;
  }
  
  /**
   * Инициализация директорий для загрузки файлов
   */
  static async initializeUploadDirectories() {
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
  }
  
  /**
   * Настройка Multer для загрузки файлов
   */
  static getUploadMiddleware() {
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
          const fileName = this.generateFileName(file.originalname, file.fieldname, userLogin);
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
        cb(new Error('Unsupported file type'), false);
      }
    };
    
    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5 // максимум 5 файлов за раз
      }
    });
  }
  
  /**
 * Создание новой транзакции
 */
async create(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const {
      property_id,
      new_owner_id,
      total_amount,
      payment_type,
      full_payment_deadline,
      schedule_payment_day,
      schedule_type,
      interest_rate,
      initial_payment,
      admin_notes,
      witnesses,
      payment_schedule
    } = req.body;
    
    // Валидация обязательных полей
    if (!property_id || !new_owner_id || !total_amount || !payment_type) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: property_id, new_owner_id, total_amount, payment_type'
      });
    }
    
    // Проверка свидетелей
    if (!witnesses || !witnesses.witness1 || !witnesses.witness2) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Two witnesses are required'
      });
    }
    
    if (!witnesses.witness1.name || !witnesses.witness1.cnic ||
      !witnesses.witness2.name || !witnesses.witness2.cnic) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Complete witness information is required'
      });
    }
    
    // Проверка существования объекта недвижимости
    const [propertyRows] = await connection.query(
      'SELECT id, price FROM units WHERE id = ?',
      [property_id]
    );
    
    if (propertyRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Property unit not found'
      });
    }
    
    const property = propertyRows[0];
    
    // Обновление цены объекта, если она не указана или равна 0
    if (!property.price || property.price === 0) {
      await connection.query(
        'UPDATE units SET price = ?, updated_at = NOW() WHERE id = ?',
        [parseFloat(total_amount), property.id]
      );
    }
    
    // Проверка существования нового владельца
    const [ownerRows] = await connection.query(
      'SELECT id FROM users WHERE id = ? AND status = "active"',
      [new_owner_id]
    );
    
    if (ownerRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'New owner not found or inactive'
      });
    }
    
    // Получаем предыдущего владельца из истории владения
    const previous_owner_id = await TransactionController.getPreviousOwner(property_id);
    
    // Убедимся, что все необходимые колонки существуют с увеличенным размером для schedule_type
    const columnsToCheck = [
      { name: 'payment_type', type: 'ENUM("full", "schedule") NOT NULL DEFAULT "full"' },
      { name: 'full_payment_deadline', type: 'DATE NULL' },
      { name: 'schedule_payment_day', type: 'TINYINT UNSIGNED NULL' },
      { name: 'schedule_type', type: 'VARCHAR(100) NULL' }, // УВЕЛИЧЕН С 50 ДО 100
      { name: 'interest_rate', type: 'DECIMAL(5,2) DEFAULT 0' },
      { name: 'initial_payment', type: 'DECIMAL(12,2) DEFAULT 0' },
      { name: 'payment_status', type: 'VARCHAR(20) DEFAULT "not_started"' },
      { name: 'paid_amount', type: 'DECIMAL(12,2) DEFAULT 0' }
    ];
    
    for (const column of columnsToCheck) {
      try {
        // Для schedule_type сначала удаляем старую колонку, если она есть, и создаем новую
        if (column.name === 'schedule_type') {
          try {
            await connection.query(`ALTER TABLE transactions DROP COLUMN IF EXISTS ${column.name}`);
            console.log(`[TRANSACTION] Dropped old ${column.name} column`);
          } catch (dropError) {
            // Игнорируем ошибку, если колонки нет
            if (dropError.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
              console.error(`[TRANSACTION] Error dropping ${column.name} column:`, dropError);
            }
          }
        }
        
        await connection.query(`
          ALTER TABLE transactions 
          ADD COLUMN ${column.name} ${column.type}
        `);
        console.log(`[TRANSACTION] Added ${column.name} column to transactions table`);
      } catch (alterError) {
        if (alterError.code !== 'ER_DUP_FIELDNAME') {
          console.error(`[TRANSACTION] Error ensuring ${column.name} column exists:`, alterError);
        }
      }
    }
    
    // Обработка full_payment_deadline для типа оплаты "full"
    let processedFullPaymentDeadline = full_payment_deadline;
    if (payment_type === 'full') {
      if (!full_payment_deadline || full_payment_deadline === '') {
        // Если поле пустое, устанавливаем дефолтное значение (текущая дата + 30 дней)
        const defaultDeadline = new Date();
        defaultDeadline.setDate(defaultDeadline.getDate() + 30);
        processedFullPaymentDeadline = defaultDeadline.toISOString().split('T')[0];
      }
    }
    
    // Обработка schedule_type - обрезаем или преобразуем если нужно
    let processedScheduleType = schedule_type;
    if (schedule_type && schedule_type.length > 100) {
      processedScheduleType = schedule_type.substring(0, 100);
      console.log(`[TRANSACTION] Truncated schedule_type from ${schedule_type.length} to 100 chars`);
    }
    
    // Создаем запись транзакции
    const [transactionResult] = await connection.execute(
      `INSERT INTO transactions (
        property_id,
        previous_owner_id,
        new_owner_id,
        total_amount,
        payment_type,
        full_payment_deadline,
        schedule_payment_day,
        schedule_type,
        interest_rate,
        initial_payment,
        admin_notes,
        status,
        payment_status,
        paid_amount,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'not_started', 0, NOW())`,
      [
        property_id,
        previous_owner_id,
        new_owner_id,
        parseFloat(total_amount),
        payment_type,
        payment_type === 'full' ? processedFullPaymentDeadline : null,
        schedule_payment_day ? parseInt(schedule_payment_day) : null,
        processedScheduleType || null,
        interest_rate ? parseFloat(interest_rate) : 0,
        initial_payment ? parseFloat(initial_payment) : 0,
        admin_notes || null
      ]
    );
    
    const transactionId = transactionResult.insertId;
    
    // Добавление свидетелей
    if (witnesses.witness1) {
      await connection.query(
        `INSERT INTO transaction_witnesses (
          transaction_id,
          witness_type,
          name,
          cnic,
          phone
        ) VALUES (?, 'witness1', ?, ?, ?)`,
        [
          transactionId,
          witnesses.witness1.name,
          witnesses.witness1.cnic,
          witnesses.witness1.phone || null
        ]
      );
    }
    
    if (witnesses.witness2) {
      await connection.query(
        `INSERT INTO transaction_witnesses (
          transaction_id,
          witness_type,
          name,
          cnic,
          phone
        ) VALUES (?, 'witness2', ?, ?, ?)`,
        [
          transactionId,
          witnesses.witness2.name,
          witnesses.witness2.cnic,
          witnesses.witness2.phone || null
        ]
      );
    }
    
    // Добавление графика платежей для рассрочки
    if (payment_type === 'schedule' && payment_schedule && Array.isArray(payment_schedule)) {
      for (const payment of payment_schedule) {
        await connection.query(
          `INSERT INTO transaction_payments (
            transaction_id,
            amount,
            due_date,
            status,
            created_at
          ) VALUES (?, ?, ?, 'pending', NOW())`,
          [
            transactionId,
            payment.amount,
            payment.due_date
          ]
        );
      }
    }
    
    // Обновление истории владения (закрываем предыдущую запись)
    if (previous_owner_id) {
      await connection.query(
        `UPDATE ownership_history 
         SET to_date = NOW() 
         WHERE property_id = ? 
         AND owner_id = ? 
         AND to_date IS NULL`,
        [property_id, previous_owner_id]
      );
    }
    
    // Создаем новую запись в истории владения
    await connection.query(
      `INSERT INTO ownership_history (
        property_id,
        owner_id,
        from_date,
        transaction_id
      ) VALUES (?, ?, NOW(), ?)`,
      [property_id, new_owner_id, transactionId]
    );
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transactionId,
      propertyUpdated: !property.price || property.price === 0
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating transaction:', error);
    
    // Более информативное сообщение об ошибке
    let errorMessage = 'Error creating transaction';
    if (error.code === 'WARN_DATA_TRUNCATED') {
      errorMessage = 'Data too long for one of the fields. Please check the input data.';
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = 'Data too long for one of the fields. Please check the input data.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
}
  
  /**
   * Получение всех транзакций (для администратора)
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search = '', property_id } = req.query;
      const offset = (page - 1) * limit;
      
      console.log('Getting transactions with:', { page, limit, offset });
      
      // Build where/filters dynamically
      let where = 'WHERE 1=1';
      const params = [];
      if (property_id) {
        where += ' AND t.property_id = ?';
        params.push(property_id);
      }
      if (search && search.trim() !== '') {
        where += ' AND (t.id = ? OR u1.name LIKE ? OR u2.name LIKE ? OR u.name LIKE ?)';
        params.push(search, `%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      const [transactions] = await pool.query(`
        SELECT 
          t.*,
          u1.name as previous_owner_name,
          u2.name as new_owner_name,
          u.name as property_name,
          u.type as property_type,
          u.area as property_area,
          u.price as property_price
        FROM transactions t
        LEFT JOIN users u1 ON t.previous_owner_id = u1.id
        LEFT JOIN users u2 ON t.new_owner_id = u2.id
        LEFT JOIN units u ON t.property_id = u.id
        ${where}
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), parseInt(offset)]);
      
      // Получаем общее количество транзакций
      let totalWhere = 'WHERE 1=1';
      const countParams = [];
      if (property_id) {
        totalWhere += ' AND property_id = ?';
        countParams.push(property_id);
      }
      if (search && search.trim() !== '') {
        totalWhere += ' AND (id = ? OR property_id LIKE ?)';
        countParams.push(search, `%${search}%`);
      }
      const [totalRows] = await pool.query(`SELECT COUNT(*) as count FROM transactions ${totalWhere}`, countParams);
      const total = totalRows[0].count;
      
      // Обогащаем транзакции дополнительной информацией
      const enrichedTransactions = transactions.map(transaction => ({
        id: transaction.id,
        property_id: transaction.property_id,
        property_name: transaction.property_name || 'Unknown Property',
        property_type: transaction.property_type || 'unknown',
        property_area: transaction.property_area,
        property_price: transaction.property_price,
        previous_owner_id: transaction.previous_owner_id,
        previous_owner_name: transaction.previous_owner_name || 'N/A',
        new_owner_id: transaction.new_owner_id,
        new_owner_name: transaction.new_owner_name || 'N/A',
        status: transaction.status,
        total_amount: transaction.total_amount,
        payment_type: transaction.payment_type,
        full_payment_deadline: transaction.full_payment_deadline,
        schedule_payment_day: transaction.schedule_payment_day,
        schedule_type: transaction.schedule_type,
        interest_rate: transaction.interest_rate,
        initial_payment: transaction.initial_payment,
        payment_status: transaction.payment_status,
        paid_amount: transaction.paid_amount,
        admin_notes: transaction.admin_notes,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      }));
      
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
        message: 'Internal server error'
      });
    }
  }
  
  /**
   * Получение транзакции по ID
   */
  async getById(req, res) {
    try {
      const transactionId = parseInt(req.params.id);
      
      const [transactions] = await pool.query(`
        SELECT t.*, 
               u1.name as previous_owner_name,
               u2.name as new_owner_name,
               unit.name as property_name,
               unit.type as property_type,
               unit.area as property_area,
               unit.price as property_price,
               COALESCE(SUM(CASE WHEN tp.status = 'paid' THEN tp.amount ELSE 0 END), 0) as total_paid,
               COUNT(DISTINCT tp.id) as total_payments,
               COUNT(DISTINCT CASE WHEN tp.status = 'paid' THEN tp.id END) as completed_payments
        FROM transactions t
        LEFT JOIN users u1 ON t.previous_owner_id = u1.id
        LEFT JOIN users u2 ON t.new_owner_id = u2.id
        LEFT JOIN units unit ON t.property_id = unit.id
        LEFT JOIN transaction_payments tp ON t.id = tp.transaction_id
        WHERE t.id = ?
        GROUP BY t.id
      `, [transactionId]);
      
      if (transactions.length === 0) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      const [witnesses] = await pool.query(
        'SELECT witness_type, name, cnic, phone FROM transaction_witnesses WHERE transaction_id = ?',
        [transactionId]
      );
      
      const formattedWitnesses = witnesses.reduce((acc, witness) => {
        acc[witness.witness_type] = {
          name: witness.name,
          cnic: witness.cnic,
          phone: witness.phone
        };
        return acc;
      }, {});
      
      //еще поле payment_date надо
      const [payments] = await pool.query(`
        SELECT p.*, 
               f.file_path, 
               f.original_name as receipt_name,
               f.file_type as receipt_type
        FROM transaction_payments p
        LEFT JOIN transaction_files f ON p.receipt_file_id = f.id
        WHERE p.transaction_id = ?
        ORDER BY p.due_date ASC
      `, [transactionId]);
      
      const [files] = await pool.query(`
        SELECT id, file_name, original_name, file_type, file_path, category, created_at
        FROM transaction_files
        WHERE transaction_id = ?
        ORDER BY created_at DESC
      `, [transactionId]);
      
      const currentTransaction = transactions[0];
      const remainingAmount = currentTransaction.total_amount - currentTransaction.total_paid;
      
      // Рассчитываем график платежей если это рассрочка
      let calculatedSchedule = [];
      if (currentTransaction.payment_type === 'schedule') {
        const principal = Math.max(0, currentTransaction.total_amount - (currentTransaction.initial_payment || 0));
        const months = 12; // дефолтное значение
        const monthlyRate = (currentTransaction.interest_rate || 0) / 12 / 100;
        const dayOfMonth = currentTransaction.schedule_payment_day || 1;
        const scheduleType = currentTransaction.schedule_type || 'equal_installments';
        
        if (principal > 0 && months > 0) {
          calculatedSchedule = TransactionController.calculatePaymentSchedule(
            principal,
            months,
            monthlyRate,
            dayOfMonth,
            scheduleType,
            currentTransaction.initial_payment || 0
          );
        }
      }
      
      const response = {
        success: true,
        ...currentTransaction,
        witnesses: formattedWitnesses,
        property_info: {
          name: currentTransaction.property_name,
          type: currentTransaction.property_type,
          area: currentTransaction.property_area,
          price: currentTransaction.property_price
        },
        payments: payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          due_date: payment.due_date,
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
        calculated_schedule: calculatedSchedule,
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
          remaining_amount: remainingAmount,
          total_payments: currentTransaction.total_payments,
          completed_payments: currentTransaction.completed_payments,
          payment_status: currentTransaction.payment_status,
          initial_payment: currentTransaction.initial_payment || 0,
          interest_rate: currentTransaction.interest_rate || 0
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error getting transaction:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
  
 async getUserTransactions(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization token required' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    const offset = (page - 1) * limit;
    
    // ВАРИАНТ 1: Показывать все статусы, включая pending
    // const statuses = ['pending', 'approved', 'completed']; 
    
    // ВАРИАНТ 2: Показывать все статусы (если нужны все)
    // Просто убрать фильтр по статусу
    
    // ВАРИАНТ 3: Показывать все, кроме rejected и cancelled
    const statuses = ['pending', 'approved', 'completed'];
    // или
    // const excludeStatuses = ['rejected', 'cancelled'];
    
    // Преобразуем limit и offset в числа
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    
    // Формируем запрос
    let query = `
      SELECT t.*, 
             u2.name as new_owner_name
      FROM transactions t
        LEFT JOIN users u2 ON t.new_owner_id = u2.id
      WHERE t.new_owner_id = ?
    `;
    
    const queryParams = [userId];
    
    // Добавляем фильтр по статусам, если он нужен
    if (statuses && statuses.length > 0) {
      query += ` AND t.status IN (${statuses.map(() => '?').join(', ')})`;
      queryParams.push(...statuses);
    }
    
    // Добавляем сортировку и пагинацию
    query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limitNum, offsetNum);
    
    const [transactions] = await pool.query(query, queryParams);
    
    // Получаем общее количество
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM transactions 
      WHERE new_owner_id = ?
    `;
    
    const countParams = [userId];
    
    if (statuses && statuses.length > 0) {
      countQuery += ` AND status IN (${statuses.map(() => '?').join(', ')})`;
      countParams.push(...statuses);
    }
    
    const [totalRows] = await pool.query(countQuery, countParams);
    
    const total = totalRows[0].count;
    const totalPages = Math.ceil(total / limitNum);
    
    // Обогащаем транзакции данными о свойствах
    const enrichedTransactions = await Promise.all(transactions.map(async (transaction) => {
      try {
        const property = await this.getPropertyById(transaction.property_id);
        return {
          ...transaction,
          property_name: property ? property.name : 'Unknown Property',
          property_type: property ? property.type : 'unknown',
          property_area: property ? property.area : null
        };
      } catch (propError) {
        console.warn(`Failed to get property for ID ${transaction.property_id}:`, propError);
        return {
          ...transaction,
          property_name: 'Unknown Property',
          property_type: 'unknown',
          property_area: null
        };
      }
    }));
    
    res.json({
      success: true,
      transactions: enrichedTransactions,
      total,
      page: parseInt(page),
      pages: totalPages,
      limit: limitNum
    });
    
  } catch (error) {
    console.error('Error getting user transactions:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
  
  /**
   * Получение детальной информации о конкретной транзакции пользователя
   */
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
      
      // Получаем информацию о свойстве (units)
      const [unitRows] = await pool.query('SELECT * FROM units WHERE id = ?', [transaction.property_id]);
      const unit = unitRows[0];
      let area = unit ? unit.area : null;
      
      // Получаем курс PKR/USD
      let usdRate = 0;
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/PKR');
        if (response.ok) {
          const data = await response.json();
          usdRate = data.rates.USD || 0;
        }
      } catch (e) {
        usdRate = 0;
      }
      
      // Расчет цены за квадратный фут
      let pricePerSqftPKR = null;
      let pricePerSqftUSD = null;
      if (area && transaction.total_amount) {
        pricePerSqftPKR = transaction.total_amount / area;
        pricePerSqftUSD = usdRate ? pricePerSqftPKR * usdRate : null;
      }
      
      res.json({
        success: true,
        transaction: {
          id: transaction.id,
          property_id: transaction.property_id,
          property_name: unit ? unit.name : 'Unknown Property',
          property_type: unit ? unit.type : 'unknown',
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
          payments: payments,
          area: area,
          price_per_sqft_pkr: pricePerSqftPKR,
          price_per_sqft_usd: pricePerSqftUSD
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
  }
  
  /**
   * Обновление примечаний администратора для транзакции
   */
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
  }
  
  /**
 * Обновление статуса транзакции и данных свидетелей
 */
async update(req, res) {
  try {
    const transactionId = parseInt(req.params.id);
    const { status, reason, witnesses } = req.body;
    
    // Проверка прав доступа
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Валидация статуса (только если он передан)
    const validStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    // Получаем текущую транзакцию
    const [currentTransaction] = await pool.query(
      'SELECT * FROM transactions WHERE id = ?',
      [transactionId]
    );
    
    if (currentTransaction.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // ПОЛУЧАЕМ ИНФОРМАЦИЮ О КОЛОНКАХ ТАБЛИЦЫ
    const [columns] = await pool.query('SHOW COLUMNS FROM transactions');
    const existingColumns = columns.map(col => col.Field);
    
    // Добавляем колонку admin_notes если её нет
    if (!existingColumns.includes('admin_notes')) {
      try {
        await pool.query(`
          ALTER TABLE transactions 
          ADD COLUMN admin_notes TEXT NULL
        `);
        console.log('Added admin_notes column to transactions table');
      } catch (e) {
        console.error('Error adding admin_notes column:', e);
      }
    }
    
    // Добавляем колонки для свидетелей, если их нет
    const witnessColumns = [
      'witness1_name', 'witness1_cnic', 'witness1_phone',
      'witness2_name', 'witness2_cnic', 'witness2_phone'
    ];
    
    for (const column of witnessColumns) {
      if (!existingColumns.includes(column)) {
        try {
          let columnType = 'VARCHAR(255) NULL';
          if (column.includes('cnic')) {
            columnType = 'VARCHAR(50) NULL';
          } else if (column.includes('phone')) {
            columnType = 'VARCHAR(50) NULL';
          }
          
          await pool.query(`
            ALTER TABLE transactions 
            ADD COLUMN ${column} ${columnType}
          `);
          console.log(`Added ${column} column to transactions table`);
        } catch (e) {
          console.error(`Error adding ${column} column:`, e);
        }
      }
    }
    
    // ДИНАМИЧЕСКОЕ ФОРМИРОВАНИЕ ЗАПРОСА - ТОЛЬКО ПЕРЕДАННЫЕ ПОЛЯ
    const updates = [];
    const params = [];
    
    // Добавляем статус только если он передан
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    
    // Добавляем admin_notes только если он передан
    if (reason !== undefined) {
      updates.push('admin_notes = ?');
      params.push(reason || null);
    }
    
    // Добавляем данные свидетелей, только если они переданы
    if (witnesses) {
      if (witnesses.witness1) {
        if (witnesses.witness1.name !== undefined) {
          updates.push('witness1_name = ?');
          params.push(witnesses.witness1.name || null);
        }
        if (witnesses.witness1.cnic !== undefined) {
          updates.push('witness1_cnic = ?');
          params.push(witnesses.witness1.cnic || null);
        }
        if (witnesses.witness1.phone !== undefined) {
          updates.push('witness1_phone = ?');
          params.push(witnesses.witness1.phone || null);
        }
      }
      
      if (witnesses.witness2) {
        if (witnesses.witness2.name !== undefined) {
          updates.push('witness2_name = ?');
          params.push(witnesses.witness2.name || null);
        }
        if (witnesses.witness2.cnic !== undefined) {
          updates.push('witness2_cnic = ?');
          params.push(witnesses.witness2.cnic || null);
        }
        if (witnesses.witness2.phone !== undefined) {
          updates.push('witness2_phone = ?');
          params.push(witnesses.witness2.phone || null);
        }
      }
    }
    
    // Если нет полей для обновления
    if (updates.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No fields to update',
        transaction: currentTransaction[0]
      });
    }
    
    // Добавляем ID в параметры
    params.push(transactionId);
    
    // Выполняем обновление
    const [result] = await pool.query(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Если транзакция одобрена (только если статус был передан и равен 'approved')
    if (status === 'approved') {
      // Проверяем, была ли транзакция уже одобрена ранее
      if (currentTransaction[0].status !== 'approved') {
        if (currentTransaction[0].property_id && currentTransaction[0].new_owner_id) {
          // Сначала закрываем предыдущую запись владельца (если есть)
          await pool.query(
            `UPDATE ownership_history 
             SET to_date = NOW() 
             WHERE property_id = ? AND to_date IS NULL`,
            [currentTransaction[0].property_id]
          );
          
          // Проверяем, существует ли колонка transaction_id
          const [historyColumns] = await pool.query('SHOW COLUMNS FROM ownership_history');
          const historyColumnsExist = historyColumns.map(col => col.Field);
          
          if (historyColumnsExist.includes('transaction_id')) {
            // Создаем новую запись с transaction_id
            await pool.query(
              `INSERT INTO ownership_history 
               (property_id, owner_id, from_date, to_date, transaction_id) 
               VALUES (?, ?, NOW(), NULL, ?)`,
              [currentTransaction[0].property_id, currentTransaction[0].new_owner_id, transactionId]
            );
          } else {
            // Создаем новую запись без transaction_id
            await pool.query(
              `INSERT INTO ownership_history 
               (property_id, owner_id, from_date, to_date) 
               VALUES (?, ?, NOW(), NULL)`,
              [currentTransaction[0].property_id, currentTransaction[0].new_owner_id]
            );
          }
          
          console.log(`Ownership history updated for property ${currentTransaction[0].property_id}`);
        } else {
          console.error('Transaction data incomplete for ownership history', currentTransaction[0]);
        }
      }
    }
    
    // Возвращаем обновленные данные
    const [updatedTransaction] = await pool.query(
      `SELECT 
        id, property_id, status, total_amount, paid_amount,
        witness1_name, witness1_cnic, witness1_phone,
        witness2_name, witness2_cnic, witness2_phone,
        admin_notes, created_at, updated_at
       FROM transactions WHERE id = ?`,
      [transactionId]
    );
    
    res.json({ 
      success: true, 
      message: 'Transaction updated successfully',
      transaction: updatedTransaction[0]
    });
    
  } catch (error) {
    console.error('Error updating transaction:', error);
    console.error('Request details:', {
      params: req.params,
      body: req.body,
      user: req.user
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error.message
    });
  }
}
  
  /**
   * Загрузка файлов
   */
  async uploadFiles(req, res) {
    try {
      const transactionId = req.params.id;
      const filesArray = req.files || [];
      const { type } = req.body; 
      let category = req.body.category; 
      
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
      
      if (type === 'single') {
        const file = files.file[0]; // Один файл в поле 'file'
        let userLogin = req.user?.login || 'unknown';
        const fullFileName = this.makeFullFileName(file.originalname, userLogin);
        const newAbsPath = path.join(path.dirname(file.path), fullFileName);
        await fs.rename(file.path, newAbsPath);
        
        const [result] = await pool.query(
          'INSERT INTO transaction_files (transaction_id, file_name, original_name, file_type, file_path, category) VALUES (?, ?, ?, ?, ?, ?)',
          [
            transactionId,
            fullFileName,
            file.originalname,
            file.mimetype,
            this.getRelativePath(newAbsPath),
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
            const fullFileName = this.makeFullFileName(file.originalname, userLogin);
            const newAbsPath = path.join(path.dirname(file.path), fullFileName);
            await fs.rename(file.path, newAbsPath);
            
            const [result] = await pool.query(
              'INSERT INTO transaction_files (transaction_id, file_name, original_name, file_type, file_path, category) VALUES (?, ?, ?, ?, ?, ?)',
              [
                transactionId,
                fullFileName,
                file.originalname,
                file.mimetype,
                TransactionController.getRelativePath(newAbsPath),
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
  }
  
  /**
   * Получение файлов сделки
   */
  async getFiles(req, res) {
    try {
      const [files] = await pool.query(
        'SELECT * FROM transaction_files WHERE transaction_id = ?',
        [req.params.id]
      );
      
      res.json(files);
    } catch (error) {
      console.error('Error getting files:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
  
  /**
   * Удаление файла
   */
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
  }
  
  /**
   * Получение сделок пользователя по конкретному объекту
   */
  async getUserPropertyTransactions(req, res) {
    try {
      const userId = req.user.id;
      const propertyId = req.params.propertyId;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      
      // Проверяем существование объекта недвижимости
      const property = await this.getPropertyById(propertyId);
      if (!property) {
        return res.status(400).json({ success: false, message: 'Property unit not found' });
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
      console.error('Error getting user property transactions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
  /**
 * Создание платежа
 */
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
    
    // НОРМАЛИЗАЦИЯ ДАТЫ: Конвертируем в правильный формат для MySQL
    let formattedPaymentDate;
    if (payment_date) {
      // Если дата пришла в ISO формате (с 'T' и 'Z')
      if (payment_date.includes('T')) {
        const date = new Date(payment_date);
        // Форматируем в YYYY-MM-DD HH:MM:SS
        formattedPaymentDate = date.toISOString().slice(0, 19).replace('T', ' ');
      } else {
        // Если дата уже в правильном формате
        formattedPaymentDate = payment_date;
      }
    } else {
      // Если дата не передана — ставим текущую
      formattedPaymentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
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
      const relativePath = TransactionController.getRelativePath(receiptFile.path);
      
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
    
    // Создаем платеж с правильным форматом даты
    const [result] = await pool.query(
      `INSERT INTO transaction_payments (
        transaction_id, amount, payment_date, payment_method, notes, receipt_file_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        transactionId,
        amount,
        formattedPaymentDate, // Используем отформатированную дату
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
}
  
  /**
   * Получение платежей по транзакции
   */
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
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      res.json({
        success: true,
        payments,
        total_amount: transaction[0].total_amount,
        paid_amount: transaction[0].paid_amount,
        remaining_amount: transaction[0].total_amount - transaction[0].paid_amount
      });
    } catch (error) {
      console.error('Error getting payments:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
  
  /**
   * Обновление платежа
   */
  async updatePayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { status, notes, receipt_file_id, payment_method, amount, payment_date } = req.body;
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
      
      if (payment_method !== undefined) {
        updates.push('payment_method = ?');
        values.push(payment_method);
      }
      
      if (amount !== undefined) {
        // validate numeric
        const num = parseFloat(amount);
        if (!isNaN(num)) {
          updates.push('amount = ?');
          values.push(num);
        }
      }
      
      if (payment_date !== undefined) {
        updates.push('payment_date = ?');
        values.push(payment_date);
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
      } else if (typeof receipt_file_id !== 'undefined' && receipt_file_id !== null && receipt_file_id !== '') {
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
  }
  
  /**
   * Удаление платежа
   */
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
  }
  
  /**
   * Получение платежа по ID
   */
async getPaymentById(req, res) {
  try {
    const transactionId = parseInt(req.params.id);
    const paymentId = parseInt(req.params.paymentId);
    
    // Получаем платеж по ID с информацией о квитанции
    const [payment] = await pool.query(`
      SELECT p.*, 
             f.file_path as receipt_path,
             f.original_name as receipt_name,
             f.file_type as receipt_type
      FROM transaction_payments p
      LEFT JOIN transaction_files f ON p.receipt_file_id = f.id
      WHERE p.id = ? AND p.transaction_id = ?
    `, [paymentId, transactionId]);
    
    if (!payment || payment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Форматируем ответ аналогично тому, как это делается в getById транзакции
    const paymentData = payment[0];
    
    // Создаем объект receipt если есть путь к файлу
    let receipt = null;
    if (paymentData.receipt_path) {
      receipt = {
        path: paymentData.receipt_path,
        name: paymentData.receipt_name,
        type: paymentData.receipt_type
      };
    }
    
    // Убираем лишние поля из основного объекта
    const { receipt_path, receipt_name, receipt_type, ...cleanPayment } = paymentData;
    
    res.json({
      success: true,
      payment: {
        ...cleanPayment,
        receipt: receipt
      }
    });
    
  } catch (error) {
    console.error('Error getting payment by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting payment'
    });
  }
}
  
  /**
   * Получение детальной информации о транзакции для клиента
   * Включает рассчитанный график платежей
   */
  async getUserTransactionDetails(req, res) {
    try {
      const userId = req.user.id; // Получаем ID пользователя из токена (после auth)
      const transactionId = req.params.id;
      
      // 1. Получаем транзакцию с проверкой принадлежности пользователю
      const [transactionRows] = await pool.query(
        'SELECT * FROM transactions WHERE id = ? AND (previous_owner_id = ? OR new_owner_id = ?)',
        [transactionId, userId, userId]
      );
      
      if (transactionRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found or access denied'
        });
      }
      
      const transaction = transactionRows[0];
      
      // 2. Получаем совершенные платежи из БД
      const [payments] = await pool.query(
        'SELECT * FROM transaction_payments WHERE transaction_id = ? ORDER BY payment_date ASC',
        [transactionId]
      );
      
      // 3. Рассчитываем полный график платежей
      let fullPaymentSchedule = [];
      
      if (transaction.payment_type === 'full') {
        // Для полной оплаты график состоит из одного платежа
        fullPaymentSchedule = [{
          installment: 1,
          amount: transaction.total_amount,
          due_date: transaction.full_payment_deadline,
          status: payments.length > 0 ? 'paid' : 'pending',
          payment_id: payments.length > 0 ? payments[0].id : null,
          payment_date: payments.length > 0 ? payments[0].payment_date : null,
          payment_method: payments.length > 0 ? payments[0].payment_method : null,
        }];
      } else if (transaction.payment_type === 'schedule') {
        // Для оплаты по расписанию рассчитываем график
        // Пока что просто возьмем платежи из БД как есть и добавим их в график
        fullPaymentSchedule = payments.map((p, index) => ({
          installment: index + 1,
          amount: p.amount,
          due_date: p.due_date || p.payment_date,
          status: p.status,
          payment_id: p.id,
          payment_date: p.payment_date,
          payment_method: p.payment_method,
        }));
      }
      
      // 4. Получаем файлы транзакции (документы)
      const [files] = await pool.query(
        'SELECT * FROM transaction_files WHERE transaction_id = ?',
        [transactionId]
      );
      
      // 5. Получаем свидетелей транзакции
      const [witnesses] = await pool.query(
        'SELECT * FROM transaction_witnesses WHERE transaction_id = ?',
        [transactionId]
      );
      
      res.json({
        success: true,
        transaction: {
          ...transaction,
          files,
          witnesses,
        },
        payments: fullPaymentSchedule,
      });
      
    } catch (error) {
      console.error('Error getting user transaction details:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
  
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
  
  /**
   * Получение объекта недвижимости по ID
   */
  async getPropertyById(propertyId) {
    try {
      const [unitRows] = await pool.query(
        'SELECT id, name, type, area FROM units WHERE id = ?',
        [propertyId]
      );
      
      if (unitRows.length > 0) {
        return unitRows[0];
      }
      return null;
    } catch (error) {
      console.error('Error fetching property by ID:', error);
      return null;
    }
  }

 /**
 * Удаление транзакции
 */
async deleteTransaction(req, res) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const transactionId = parseInt(req.params.id);
    
    if (isNaN(transactionId)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID'
      });
    }
    
    // 1. Проверяем существование транзакции
    const [transaction] = await connection.query(
      'SELECT id, property_id, status, new_owner_id, previous_owner_id FROM transactions WHERE id = ?',
      [transactionId]
    );
    
    if (transaction.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    const trans = transaction[0];
    
    // 2. Получаем все файлы связанные с транзакцией
    const [files] = await connection.query(
      'SELECT id, file_path FROM transaction_files WHERE transaction_id = ?',
      [transactionId]
    );
    
    // 3. Удаляем файлы с диска (если они существуют)
    for (const file of files) {
      try {
        if (file.file_path) {
          // Используем path.join для корректного формирования пути
          const fullPath = path.join(UPLOAD_PATH, file.file_path);
          
          // Проверяем существование файла с помощью fs.access
          try {
            await fs.access(fullPath);
            // Файл существует, удаляем его
            await fs.unlink(fullPath);
            console.log(`Deleted file: ${fullPath}`);
          } catch (accessError) {
            // Файл не существует, это нормально
            console.log(`File not found, skipping: ${fullPath}`);
          }
        }
      } catch (fileError) {
        console.warn(`Failed to delete file ${file.file_path}:`, fileError.message);
        // Продолжаем удаление даже если файл не найден
      }
    }
    
    // 4. Удаляем записи из связанных таблиц в правильном порядке
    
    // 4.1. Удаляем свидетелей
    await connection.query(
      'DELETE FROM transaction_witnesses WHERE transaction_id = ?',
      [transactionId]
    );
    
    // 4.2. Удаляем файлы из базы данных
    await connection.query(
      'DELETE FROM transaction_files WHERE transaction_id = ?',
      [transactionId]
    );
    
    // 4.3. Удаляем платежи
    await connection.query(
      'DELETE FROM transaction_payments WHERE transaction_id = ?',
      [transactionId]
    );
    
    // 4.4. Удаляем саму транзакцию
    const [result] = await connection.query(
      'DELETE FROM transactions WHERE id = ?',
      [transactionId]
    );
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // 5. Если транзакция была одобрена, обновляем историю владения
    if (trans.status === 'approved') {
      try {
        // Проверяем, есть ли колонка transaction_id в таблице ownership_history
        const [tableInfo] = await connection.query(`
          SHOW COLUMNS FROM ownership_history LIKE 'transaction_id'
        `);
        
        if (tableInfo.length > 0) {
          // Колонка существует, обновляем
          await connection.query(
            'UPDATE ownership_history SET transaction_id = NULL WHERE transaction_id = ?',
            [transactionId]
          );
        }
        
        // Получаем текущую запись владения для этого объекта
        const [currentOwnerHistory] = await connection.query(`
          SELECT * FROM ownership_history 
          WHERE property_id = ? 
          AND owner_id = ?
          ORDER BY from_date DESC 
          LIMIT 1
        `, [trans.property_id, trans.new_owner_id]);
        
        if (currentOwnerHistory.length > 0) {
          // Удаляем запись о текущем владельце (который был добавлен при одобрении транзакции)
          await connection.query(
            'DELETE FROM ownership_history WHERE id = ?',
            [currentOwnerHistory[0].id]
          );
          
          // Если был предыдущий владелец, восстанавливаем его
          if (trans.previous_owner_id) {
            // Проверяем, есть ли запись о предыдущем владельце
            const [prevOwnerHistory] = await connection.query(`
              SELECT * FROM ownership_history 
              WHERE property_id = ? 
              AND owner_id = ?
              ORDER BY from_date DESC 
              LIMIT 1
            `, [trans.property_id, trans.previous_owner_id]);
            
            if (prevOwnerHistory.length > 0) {
              // Обновляем дату окончания на NULL
              await connection.query(
                'UPDATE ownership_history SET to_date = NULL WHERE id = ?',
                [prevOwnerHistory[0].id]
              );
            } else {
              // Создаем новую запись для предыдущего владельца
              await connection.query(
                `INSERT INTO ownership_history 
                  (property_id, owner_id, from_date, to_date) 
                  VALUES (?, ?, NOW(), NULL)`,
                [trans.property_id, trans.previous_owner_id]
              );
            }
          }
        }
      } catch (historyError) {
        console.warn('Error updating ownership history:', historyError.message);
        // Продолжаем выполнение даже при ошибке обновления истории
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting transaction:', error);
    
    let errorMessage = 'Failed to delete transaction';
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Cannot delete transaction due to foreign key constraints';
    } else if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      errorMessage = 'Transaction is referenced by other records';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
}
  
  /**
   * Вспомогательный метод для создания имени файла
   */
  makeFullFileName(originalName, userLogin) {
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.getHours().toString().padStart(2, '0') + '-' + now.getMinutes().toString().padStart(2, '0');
    return `${base}_${userLogin}_${dateStr}_${timeStr}${ext}`;
  }
}

// Экспорт по умолчанию
export default new TransactionController();

// Экспорт констант и вспомогательных функций
export { UPLOAD_PATH };
export const uploadInit = TransactionController.initializeUploadDirectories().catch(err => {
  console.error('Failed to initialize upload directories. The application may not work correctly with file uploads.', err);
  return null;
});
export const upload = TransactionController.getUploadMiddleware();