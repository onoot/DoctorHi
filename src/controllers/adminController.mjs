import pool from '../config/database.mjs';

export const getUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM users WHERE 1=1';
    const queryParams = [];

    if (search) {
      query += ' AND (name LIKE ? OR cnic LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), offset);

    const [users] = await pool.query(query, queryParams);

    // Получаем общее количество
    const [totalRows] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE 1=1' +
      (search ? ' AND (name LIKE ? OR cnic LIKE ?)' : '') +
      (status ? ' AND status = ?' : ''),
      queryParams.slice(0, -2)
    );

    const total = totalRows[0].count;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      users,
      total,
      page: parseInt(page),
      pages: totalPages
    });
  } catch (error) {
    console.error('Error getting user list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [result] = await pool.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      success: true,
      message: 'User status updated' 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status} = req.body;

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Начинаем транзакцию
    await pool.query('START TRANSACTION');

    // Сначала получаем информацию о транзакции
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE id = ?',
      [transactionId]
    );

    if (transactions.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const transaction = transactions[0];

    // Обновляем статус транзакции
    const [result] = await pool.query(
      'UPDATE transactions SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, transactionId]
    );

    // Если транзакция одобрена, обновляем историю владения
    if (status === 'approved') {
      // Добавляем новую запись в историю владения
      await pool.query(
        'INSERT INTO ownership_history (property_id, owner_id, from_date) VALUES (?, ?, NOW())',
        [transaction.property_id, transaction.new_owner_id]
      );

      // Закрываем предыдущую запись в истории владения
      if (transaction.previous_owner_id) {
        await pool.query(
          'UPDATE ownership_history SET to_date = NOW() WHERE property_id = ? AND owner_id = ? AND to_date IS NULL',
          [transaction.property_id, transaction.previous_owner_id]
        );
      }
    }

    await pool.query('COMMIT');
    res.json({ 
      success: true,
      message: 'Transaction status updated successfully',
      transaction_id: transactionId
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error updating transaction status:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      details: error.message 
    });
  }
};

export const clearTransactionHistory = async (req, res) => {
  try {
    const { older_than, status } = req.body;

    if (!older_than || !status || !Array.isArray(status)) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    const query = `
      DELETE FROM transactions 
      WHERE status IN (?) 
      AND created_at < ?
    `;

    const [result] = await pool.query(query, [status, older_than]);

    res.json({
      success: true,
      message: 'Transaction history cleared',
      deleted_count: result.affectedRows
    });
  } catch (error) {
    console.error('Error clearing transaction history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 