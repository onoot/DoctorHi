import pool from '../config/database.mjs';

class Payment {
    static async create(paymentData) {
        const {
            transaction_id,
            amount,
            payment_date,
            payment_method,
            notes,
            receipt_file_id
        } = paymentData;

        const [result] = await pool.execute(
            `INSERT INTO transaction_payments (
                transaction_id,
                amount,
                payment_date,
                payment_method,
                notes,
                receipt_file_id,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [transaction_id, amount, payment_date, payment_method, notes, receipt_file_id]
        );
        return result.insertId;
    }

    static async getById(id) {
        const [rows] = await pool.execute(
            `SELECT 
                tp.*,
                tf.file_name as receipt_file_name,
                tf.file_path as receipt_file_path
            FROM transaction_payments tp
            LEFT JOIN transaction_files tf ON tp.receipt_file_id = tf.id
            WHERE tp.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async update(id, updateData) {
        const {
            status,
            notes
        } = updateData;

        const [result] = await pool.execute(
            `UPDATE transaction_payments 
            SET status = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [status, notes, id]
        );
        return result.affectedRows > 0;
    }

    static async getByTransactionId(transactionId) {
        const [rows] = await pool.execute(
            `SELECT 
                tp.*,
                tf.file_name as receipt_file_name,
                tf.file_path as receipt_file_path
            FROM transaction_payments tp
            LEFT JOIN transaction_files tf ON tp.receipt_file_id = tf.id
            WHERE tp.transaction_id = ?
            ORDER BY tp.payment_date DESC`,
            [transactionId]
        );
        return rows;
    }

    static async getTotalPaidAmount(transactionId) {
        const [rows] = await pool.execute(
            `SELECT COALESCE(SUM(amount), 0) as total_paid
            FROM transaction_payments
            WHERE transaction_id = ? AND status = 'paid'`,
            [transactionId]
        );
        return rows[0].total_paid;
    }
}

export default Payment; 