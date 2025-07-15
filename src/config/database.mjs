import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Функция для проверки существования колонки в таблице
async function columnExists(tableName, columnName) {
  const [columns] = await pool.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
  `, [process.env.DB_NAME, tableName, columnName]);
  
  return columns.length > 0;
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'doctor_heights',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Функция для получения текущего размера поля
async function getColumnLength(table, column) {
  const [rows] = await pool.query(`
    SELECT CHARACTER_MAXIMUM_LENGTH 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
  `, [table, column]);
  return rows[0]?.CHARACTER_MAXIMUM_LENGTH;
}

// Функция для инициализации базы данных
export const initializeDatabase = async () => {
  try {
    // Проверяем подключение
    await pool.query('SELECT 1');
    console.log('Database connection successful');

    // Создаем таблицу transactions если она не существует
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        property_id VARCHAR(50) NOT NULL,
        previous_owner_id INT NOT NULL,
        new_owner_id INT NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (previous_owner_id) REFERENCES users(id),
        FOREIGN KEY (new_owner_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Transactions table checked/created');

    // Создаем таблицу ownership_history если она не существует
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ownership_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        property_id VARCHAR(50) NOT NULL,
        owner_id INT NOT NULL,
        from_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        to_date TIMESTAMP NULL,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Ownership history table checked/created');

    // Проверяем тип поля property_id в таблице ownership_history
    const [ownershipPropertyIdType] = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE()
        AND table_name = 'ownership_history'
        AND column_name = 'property_id'
    `);

    if (ownershipPropertyIdType.length > 0 && !ownershipPropertyIdType[0].COLUMN_TYPE.includes('varchar')) {
      // Сначала удаляем внешний ключ если он существует
      await pool.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'ownership_history'
          AND COLUMN_NAME = 'property_id'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `).then(async ([constraints]) => {
        if (constraints.length > 0) {
          await pool.query(`
            ALTER TABLE ownership_history 
            DROP FOREIGN KEY ${constraints[0].CONSTRAINT_NAME}
          `);
          console.log('Dropped foreign key constraint for property_id in ownership_history');
        }
      });

      // Теперь можно изменить тип столбца
      await pool.query('ALTER TABLE ownership_history MODIFY COLUMN property_id VARCHAR(50) NOT NULL');
      console.log('Modified property_id column type to VARCHAR(50) in ownership_history');
    }

    // Проверяем тип поля property_id в таблице transactions
    const [propertyIdType] = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE()
        AND table_name = 'transactions'
        AND column_name = 'property_id'
    `);

    if (propertyIdType.length > 0 && !propertyIdType[0].COLUMN_TYPE.includes('varchar')) {
      // Сначала удаляем внешний ключ если он существует
      await pool.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'transactions'
          AND COLUMN_NAME = 'property_id'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `).then(async ([constraints]) => {
        if (constraints.length > 0) {
          await pool.query(`
            ALTER TABLE transactions 
            DROP FOREIGN KEY ${constraints[0].CONSTRAINT_NAME}
          `);
          console.log('Dropped foreign key constraint for property_id');
        }
      });

      // Теперь можно изменить тип столбца
      await pool.query('ALTER TABLE transactions MODIFY COLUMN property_id VARCHAR(50) NOT NULL');
      console.log('Modified property_id column type to VARCHAR(50)');
    }

    // Создаем таблицу transaction_documents если она не существует
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transaction_documents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        transaction_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Transaction documents table checked/created');

    // Создаем таблицу transaction_files если она не существует
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transaction_files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        transaction_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        category ENUM('agreement', 'receipt', 'video', 'proof_documents') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Transaction files table checked/created');

    // Создаем таблицу transaction_payments если она не существует
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transaction_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        transaction_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_date DATE NOT NULL,
        status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
        payment_method ENUM('cash', 'bank_transfer', 'check') NOT NULL,
        receipt_file_id INT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (receipt_file_id) REFERENCES transaction_files(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Transaction payments table checked/created');

    // Проверяем наличие колонки payment_method в таблице transaction_payments
    if (!await columnExists('transaction_payments', 'payment_method')) {
      await pool.query(`
        ALTER TABLE transaction_payments 
        ADD COLUMN payment_method ENUM('cash', 'bank_transfer', 'check') NOT NULL AFTER payment_date
      `);
      console.log('Added payment_method column to transaction_payments table');
    }

    // Добавляем новые поля в таблицу transactions если они не существуют
    if (!await columnExists('transactions', 'total_amount')) {
      await pool.query(`
        ALTER TABLE transactions 
        ADD COLUMN total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        ADD COLUMN payment_schedule JSON,
        ADD COLUMN paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        ADD COLUMN payment_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started'
      `);
      console.log('Added payment fields to transactions table');
    }

    // Проверяем размер поля cnic и изменяем его если нужно
    const cnicLength = await getColumnLength('users', 'cnic');
    if (cnicLength < 15) {
      await pool.query('ALTER TABLE users MODIFY COLUMN cnic VARCHAR(15) NOT NULL');
      console.log('Modified cnic column length to 15');
    }

    // Проверяем и добавляем столбец phone
    if (!await columnExists('users', 'phone')) {
      await pool.query('ALTER TABLE users ADD COLUMN phone VARCHAR(13) NULL AFTER cnic');
      console.log('Added phone column');
    }

    // Проверяем и добавляем столбец address
    if (!await columnExists('users', 'address')) {
      await pool.query('ALTER TABLE users ADD COLUMN address TEXT NULL AFTER phone');
      console.log('Added address column');
    }

    // Проверяем и добавляем столбец updated_at
    if (!await columnExists('users', 'updated_at')) {
      await pool.query('ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
      console.log('Added updated_at column');
    }
    
    console.log('Database structure updated successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export default pool; 