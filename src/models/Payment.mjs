import pool from '../config/database.mjs';

class Payment {
    static async create(paymentData) {
            const {
                transaction_id,
                amount,
                payment_date,
                planned_payment_date,
                payment_method,
                notes,
                receipt_file_id
            } = paymentData;

            const [result] = await pool.execute(
                `INSERT INTO transaction_payments (
                    transaction_id,
                    amount,
                    payment_date,
                    planned_payment_date,
                    payment_method,
                    notes,
                    receipt_file_id,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [transaction_id, amount, payment_date, planned_payment_date, payment_method, notes, receipt_file_id]
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
        // Обработка receipt_file_id, payment_method, planned_payment_date
        const fields = [];
        const values = [];

        if (updateData.status) {
            fields.push('status = ?');
            values.push(updateData.status);
        }
        if (updateData.notes !== undefined) {
            fields.push('notes = ?');
            values.push(updateData.notes);
        }
        if (updateData.payment_method !== undefined) {
            fields.push('payment_method = ?');
            values.push(updateData.payment_method);
        }
        if (updateData.planned_payment_date !== undefined) {
            fields.push('planned_payment_date = ?');
            values.push(updateData.planned_payment_date);
        }
        if (updateData.receipt_file_id !== undefined && updateData.receipt_file_id !== null) {
            fields.push('receipt_file_id = ?');
            values.push(updateData.receipt_file_id);
        }
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        if (fields.length === 1) return false; // Нет данных для обновления

        const [result] = await pool.execute(
            `UPDATE transaction_payments SET ${fields.join(', ')} WHERE id = ?`,
            values
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