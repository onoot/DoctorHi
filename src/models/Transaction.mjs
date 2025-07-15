import pool from '../config/database.mjs';

// SQL-запросы для создания таблиц
const createWitnessesTableSQL = `
  CREATE TABLE IF NOT EXISTS transaction_witnesses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    witness_type ENUM('witness1', 'witness2') NOT NULL,
    name VARCHAR(255) NOT NULL,
    cnic VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
  )
`;

const createTransferRequestsTableSQL = `
  CREATE TABLE IF NOT EXISTS transfer_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id VARCHAR(255) NOT NULL,
    requester_id INT NOT NULL,
    requester_name VARCHAR(255) NOT NULL,
    requester_cnic VARCHAR(50) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    admin_notes TEXT,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
  )
`;

// SQL-запрос для обновления таблицы transactions

const addNewColumnsSQL = `
  ALTER TABLE transactions
  ADD COLUMN witness1_id INT,
  ADD COLUMN witness2_id INT,
  ADD FOREIGN KEY (witness1_id) REFERENCES transaction_witnesses(id) ON DELETE SET NULL,
  ADD FOREIGN KEY (witness2_id) REFERENCES transaction_witnesses(id) ON DELETE SET NULL;
`;

// Создаем таблицы при инициализации
pool.query(createWitnessesTableSQL).catch(err => {
  console.error('Error creating witnesses table:', err);
});
pool.query(createTransferRequestsTableSQL).catch(err => {
  console.error('Error creating transfer_requests table:', err);
});

try {
  // Проверка наличия старого столбца 'witnesses'
  const [columns] = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'transactions' 
      AND column_name = 'witnesses';
  `);

  if (columns.length > 0) {
    await pool.query(`ALTER TABLE transactions DROP COLUMN witnesses`);
  }

  // Проверка наличия новых столбцов
  const [existingColumns] = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'transactions' 
      AND column_name IN ('witness1_id', 'witness2_id');
  `);

  const hasWitness1 = existingColumns.some(col => col.column_name === 'witness1_id');
  const hasWitness2 = existingColumns.some(col => col.column_name === 'witness2_id');

  if (!hasWitness1 || !hasWitness2) {
    await pool.query(addNewColumnsSQL);
  } else {
    console.log('Columns witness1_id and witness2_id already exist. Skipping ALTER.');
  }

} catch (error) {
  console.error('Error altering transactions table:', error);
}

class Transaction {
  static async getTransactionById(id) {
    const [rows] = await pool.execute(`
      SELECT 
        t.*,
        u1.name as previous_owner_name,
        u2.name as new_owner_name,
        JSON_ARRAYAGG(JSON_OBJECT(
          'id' VALUE tf.id,
          'file_name' VALUE tf.file_name,
          'category' VALUE tf.category
        )) as files,
        (SELECT JSON_OBJECT(
          'witness1' VALUE CASE
            WHEN w1.id IS NOT NULL THEN JSON_OBJECT(
              'id' VALUE w1.id,
              'name' VALUE w1.name,
              'cnic' VALUE w1.cnic,
              'phone' VALUE w1.phone
            ) ELSE NULL END,
          'witness2' VALUE CASE
            WHEN w2.id IS NOT NULL THEN JSON_OBJECT(
              'id' VALUE w2.id,
              'name' VALUE w2.name,
              'cnic' VALUE w2.cnic,
              'phone' VALUE w2.phone
            ) ELSE NULL END
        )
        FROM transactions tr
        LEFT JOIN transaction_witnesses w1 ON tr.witness1_id = w1.id AND w1.witness_type = 'witness1'
        LEFT JOIN transaction_witnesses w2 ON tr.witness2_id = w2.id AND w2.witness_type = 'witness2'
        WHERE tr.id = t.id LIMIT 1) as witnesses
      FROM transactions t
      LEFT JOIN users u1 ON t.previous_owner_id = u1.id
      LEFT JOIN users u2 ON t.new_owner_id = u2.id
      LEFT JOIN transaction_files tf ON t.id = tf.transaction_id
      WHERE t.id = ?
      GROUP BY t.id
    `, [id]);

    if (rows[0]) {
      // Преобразуем файлы в структурированный объект
      const files = JSON.parse(rows[0].files || '[]');
      const filesByCategory = files.reduce((acc, file) => {
        if (!acc[file.category]) {
          acc[file.category] = [];
        }
        acc[file.category].push({
          id: file.id,
          file_name: file.file_name
        });
        return acc;
      }, {});

      rows[0].files = filesByCategory;

      // Если есть данные о свидетелях - преобразуем их из строки в объект
      if (rows[0].witnesses) {
        try {
          rows[0].witnesses = JSON.parse(rows[0].witnesses);
        } catch (error) {
          console.error('Error parsing witnesses JSON:', error);
          rows[0].witnesses = null;
        }
      }

      return rows[0];
    }

    return null;
  }

  static async getAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(`
      SELECT 
        t.*,
        u1.name as previous_owner_name,
        u2.name as new_owner_name,
        (SELECT JSON_OBJECT(
          'witness1' VALUE CASE
            WHEN w1.id IS NOT NULL THEN JSON_OBJECT(
              'id' VALUE w1.id,
              'name' VALUE w1.name,
              'cnic' VALUE w1.cnic,
              'phone' VALUE w1.phone
            ) ELSE NULL END,
          'witness2' VALUE CASE
            WHEN w2.id IS NOT NULL THEN JSON_OBJECT(
              'id' VALUE w2.id,
              'name' VALUE w2.name,
              'cnic' VALUE w2.cnic,
              'phone' VALUE w2.phone
            ) ELSE NULL END
        )
        FROM transactions tr
        LEFT JOIN transaction_witnesses w1 ON tr.witness1_id = w1.id AND w1.witness_type = 'witness1'
        LEFT JOIN transaction_witnesses w2 ON tr.witness2_id = w2.id AND w2.witness_type = 'witness2'
        WHERE tr.id = t.id LIMIT 1) as witnesses
      FROM transactions t
      LEFT JOIN users u1 ON t.previous_owner_id = u1.id
      LEFT JOIN users u2 ON t.new_owner_id = u2.id
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [totalRows] = await pool.execute('SELECT COUNT(*) as count FROM transactions');

    // Преобразуем witnesses из строки в объект для каждой транзакции
    const processedRows = rows.map(row => {
      if (row.witnesses) {
        try {
          row.witnesses = JSON.parse(row.witnesses);
        } catch (error) {
          console.error('Error parsing witnesses JSON:', error);
          row.witnesses = null;
        }
      }
      return row;
    });

    return {
      data: processedRows,
      total: totalRows[0].count
    };
  }

  static async getObjectTransactions(propertyId, userId) {
    try {
      // Получаем основную информацию о транзакциях
      const [transactions] = await pool.query(`
        SELECT
          t.*,
          COALESCE(SUM(p.amount), 0) as paid_amount,
          CASE
            WHEN t.previous_owner_id = ? OR t.new_owner_id = ? THEN true
            ELSE false
          END as has_access
        FROM transactions t
        LEFT JOIN transaction_payments p ON p.transaction_id = t.id
        WHERE t.property_id = ?
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `, [userId, userId, propertyId]);

      // Фильтруем транзакции и добавляем информацию о свидетелях только для доступных
      const accessibleTransactions = [];

      for (const transaction of transactions) {
        // Если пользователь не имеет доступа, добавляем только базовую информацию
        if (!transaction.has_access) {
          accessibleTransactions.push({
            id: transaction.id,
            status: transaction.status,
            created_at: transaction.created_at,
            has_access: false
          });
          continue;
        }

        // Для пользователей с доступом получаем полную информацию
        const [witnesses] = await pool.query(`
          SELECT
            witness_type,
            name,
            cnic,
            phone
          FROM transaction_witnesses
          WHERE transaction_id = ?
        `, [transaction.id]);

        // Преобразуем массив свидетелей в объект
        const witnessesObj = witnesses.reduce((acc, witness) => {
          acc[witness.witness_type] = {
            name: witness.name,
            cnic: witness.cnic,
            phone: witness.phone
          };
          return acc;
        }, {});

        // Добавляем флаг доступа и удаляем технические поля
        delete transaction.has_access;
        transaction.has_access = true;
        transaction.witnesses = witnessesObj;

        accessibleTransactions.push(transaction);
      }

      return accessibleTransactions;
    } catch (error) {
      console.error('Error in getObjectTransactions:', error);
      throw error;
    }
  }

  static async create(transactionData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        property_id,
        previous_owner_id,
        new_owner_id,
        total_amount,
        status = 'pending',
        witnesses
      } = transactionData;

      // Создаем транзакцию
      const [result] = await connection.execute(`
        INSERT INTO transactions (
          property_id,
          previous_owner_id,
          new_owner_id,
          total_amount,
          status,
          paid_amount,
          payment_status
        ) VALUES (?, ?, ?, ?, ?, 0, 'not_started')
      `, [
        property_id,
        previous_owner_id,
        new_owner_id,
        total_amount,
        status
      ]);

      const transactionId = result.insertId;

      let witness1Id = null;
      let witness2Id = null;

      // Удаляем существующих свидетелей
      await connection.query('DELETE FROM transaction_witnesses WHERE transaction_id = ?', [transactionId]);
      // Сбрасываем ID свидетелей в транзакции
      await connection.query('UPDATE transactions SET witness1_id = NULL, witness2_id = NULL WHERE id = ?', [transactionId]);

      if (witnesses?.witness1) {
        const [w1Result] = await connection.execute(`
          INSERT INTO transaction_witnesses (
            transaction_id, 
            witness_type, 
            name, 
            cnic, 
            phone
          ) VALUES (?, 'witness1', ?, ?, ?)
        `, [
          transactionId,
          witnesses.witness1.name,
          witnesses.witness1.cnic,
          witnesses.witness1.phone
        ]);
        witness1Id = w1Result.insertId;
      }

      if (witnesses?.witness2) {
        const [w2Result] = await connection.execute(`
          INSERT INTO transaction_witnesses (
            transaction_id, 
            witness_type, 
            name, 
            cnic, 
            phone
          ) VALUES (?, 'witness2', ?, ?, ?)
        `, [
          transactionId,
          witnesses.witness2.name,
          witnesses.witness2.cnic,
          witnesses.witness2.phone
        ]);
        witness2Id = w2Result.insertId;
      }

      // Обновляем ID свидетелей в транзакции
      await connection.execute(`
        UPDATE transactions
        SET 
          witness1_id = ?,
          witness2_id = ?
        WHERE id = ?
      `, [witness1Id, witness2Id, transactionId]);

      await connection.commit();
      return transactionId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(transactionId, updateData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        status,
        witnesses
      } = updateData;

      // Удаляем старых свидетелей
      await connection.query('DELETE FROM transaction_witnesses WHERE transaction_id = ?', [transactionId]);

      let witness1Id = null;
      let witness2Id = null;

      if (witnesses?.witness1) {
        const [w1Result] = await connection.execute(`
          INSERT INTO transaction_witnesses (
            transaction_id, 
            witness_type, 
            name, 
            cnic, 
            phone
          ) VALUES (?, 'witness1', ?, ?, ?)
        `, [
          transactionId,
          witnesses.witness1.name,
          witnesses.witness1.cnic,
          witnesses.witness1.phone
        ]);
        witness1Id = w1Result.insertId;
      }

      if (witnesses?.witness2) {
        const [w2Result] = await connection.execute(`
          INSERT INTO transaction_witnesses (
            transaction_id, 
            witness_type, 
            name, 
            cnic, 
            phone
          ) VALUES (?, 'witness2', ?, ?, ?)
        `, [
          transactionId,
          witnesses.witness2.name,
          witnesses.witness2.cnic,
          witnesses.witness2.phone
        ]);
        witness2Id = w2Result.insertId;
      }

      // Обновляем ID свидетелей в транзакции
      await connection.execute(`
        UPDATE transactions
        SET 
          witness1_id = ?,
          witness2_id = ?,
          status = ?
        WHERE id = ?
      `, [witness1Id, witness2Id, status, transactionId]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async createPayment(paymentData) {
    const {
      transaction_id,
      amount,
      payment_date,
      payment_method,
      notes,
      receipt_file_id
    } = paymentData;

    const [result] = await pool.execute(`
      INSERT INTO transaction_payments (
        transaction_id,
        amount,
        payment_date,
        payment_method,
        notes,
        receipt_file_id,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [
      transaction_id,
      amount,
      payment_date,
      payment_method,
      notes,
      receipt_file_id
    ]);

    // Обновляем paid_amount и payment_status в transactions
    await this.updateTransactionPaymentStatus(transaction_id);

    return result.insertId;
  }

  static async updateTransactionPaymentStatus(transactionId) {
    const [paymentResult] = await pool.execute(`
      SELECT SUM(amount) as total_paid
      FROM transaction_payments
      WHERE transaction_id = ? AND status = 'completed'
    `, [transactionId]);

    const totalPaid = paymentResult[0]?.total_paid || 0;

    await pool.execute(`
      UPDATE transactions
      SET 
        paid_amount = ?,
        payment_status = ?
      WHERE id = ?
    `, [
      totalPaid,
      totalPaid >= 0 ? 'partially_paid' : 'not_started',
      transactionId
    ]);
  }

  static async validateAdmin() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/validate`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        window.location.href = '/admin-panel.html';
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  }

  static async handleLogin(email, password) {
    try {
      console.log('Attempting login...');
      const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        window.location.href = '/admin-panel.html';
        showNotification('success', "Success");
      } else {
        showNotification('error', "Invalid password or login");
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('error', error);
      return false;
    }
  }

  static showNotification(type, message) {
    let duration = 3000;
    // Создаем контейнер для уведомлений, если его еще нет
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      document.body.appendChild(container);
    }

    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Добавляем уведомление в контейнер
    container.appendChild(notification);

    // Показываем уведомление с анимацией
    setTimeout(() => {
      notification.classList.add('show');
    }, 10); // Небольшая задержка для корректного запуска анимации

    // Автоматически скрываем и удаляем уведомление через указанное время
    setTimeout(() => {
      notification.classList.remove('show'); // Запускаем анимацию исчезновения
      setTimeout(() => {
        notification.remove(); // Удаляем элемент из DOM
      }, 300); // Ждем завершения анимации исчезновения
    }, duration);
  }
}

export default Transaction;