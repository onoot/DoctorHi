import pool from '../config/database.mjs';

class TransactionFile {
    static async create(fileData) {
        const {
            transaction_id,
            file_name,
            original_name,
            file_type,
            file_path,
            category
        } = fileData;

        const [result] = await pool.execute(
            `INSERT INTO transaction_files (
                transaction_id,
                file_name,
                original_name,
                file_type,
                file_path,
                category
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [transaction_id, file_name, original_name, file_type, file_path, category]
        );
        return result.insertId;
    }

    static async getById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM transaction_files WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async getByTransactionId(transactionId) {
        const [rows] = await pool.execute(
            'SELECT * FROM transaction_files WHERE transaction_id = ?',
            [transactionId]
        );
        return rows;
    }

    static async getByCategory(transactionId, category) {
        const [rows] = await pool.execute(
            'SELECT * FROM transaction_files WHERE transaction_id = ? AND category = ?',
            [transactionId, category]
        );
        return rows;
    }

    static async delete(id) {
        const [result] = await pool.execute(
            'DELETE FROM transaction_files WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}

export default TransactionFile; 