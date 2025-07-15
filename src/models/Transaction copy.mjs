// import pool from '../config/database.mjs';

// const createWitnessesTableSQL = `
// CREATE TABLE IF NOT EXISTS transaction_witnesses (
//     id INT PRIMARY KEY AUTO_INCREMENT,
//     transaction_id INT NOT NULL,
//     witness_type ENUM('witness1', 'witness2') NOT NULL,
//     name VARCHAR(255) NOT NULL,
//     cnic VARCHAR(50) NOT NULL,
//     phone VARCHAR(50),
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//     FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
// )`;

// const createTransferRequestsTableSQL = `
// CREATE TABLE IF NOT EXISTS transfer_requests (
//     id INT PRIMARY KEY AUTO_INCREMENT,
//     property_id VARCHAR(255) NOT NULL,
//     requester_id INT NOT NULL,
//     requester_name VARCHAR(255) NOT NULL,
//     requester_cnic VARCHAR(50) NOT NULL,
//     status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//     admin_notes TEXT,
//     FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
// )`;

// // Добавляем SQL для обновления таблицы transactions
// const alterTransactionsTableSQL = `
// ALTER TABLE transactions 
// ADD COLUMN IF NOT EXISTS witness1_id INT,
// ADD COLUMN IF NOT EXISTS witness2_id INT,
// ADD FOREIGN KEY (witness1_id) REFERENCES transaction_witnesses(id) ON DELETE SET NULL,
// ADD FOREIGN KEY (witness2_id) REFERENCES transaction_witnesses(id) ON DELETE SET NULL,
// DROP COLUMN IF EXISTS witnesses`;

// // Создаем таблицу при инициализации
// pool.query(createWitnessesTableSQL).catch(err => {
//     console.error('Error creating witnesses table:', err);
// });

// pool.query(createTransferRequestsTableSQL).catch(err => {
//     console.error('Error creating transfer_requests table:', err);
// });

// pool.query(alterTransactionsTableSQL).catch(err => {
//     console.error('Error altering transactions table:', err);
// });

// class Transaction {
//     static async create(transactionData) {
//         const connection = await pool.getConnection();
//         try {
//             await connection.beginTransaction();

//             const {
//                 property_id,
//                 previous_owner_id,
//                 new_owner_id,
//                 total_amount,
//                 status = 'pending',
//                 witnesses
//             } = transactionData;

//             // Создаем транзакцию
//             const [result] = await connection.execute(
//                 `INSERT INTO transactions (
//                     property_id,
//                     previous_owner_id,
//                     new_owner_id,
//                     total_amount,
//                     status,
//                     paid_amount,
//                     payment_status
//                 ) VALUES (?, ?, ?, ?, ?, 0, 'not_started')`,
//                 [property_id, previous_owner_id, new_owner_id, total_amount, status]
//             );

//             const transactionId = result.insertId;
//             let witness1Id = null;
//             let witness2Id = null;

//             // Если есть свидетели, добавляем их
//             if (witnesses) {
//                 const { witness1, witness2 } = witnesses;
                
//                 if (witness1) {
//                     const [w1Result] = await connection.execute(
//                         `INSERT INTO transaction_witnesses 
//                         (transaction_id, witness_type, name, cnic, phone)
//                         VALUES (?, 'witness1', ?, ?, ?)`,
//                         [transactionId, witness1.name, witness1.cnic, witness1.phone]
//                     );
//                     witness1Id = w1Result.insertId;
//                 }
                
//                 if (witness2) {
//                     const [w2Result] = await connection.execute(
//                         `INSERT INTO transaction_witnesses 
//                         (transaction_id, witness_type, name, cnic, phone)
//                         VALUES (?, 'witness2', ?, ?, ?)`,
//                         [transactionId, witness2.name, witness2.cnic, witness2.phone]
//                     );
//                     witness2Id = w2Result.insertId;
//                 }

//                 // Обновляем ID свидетелей в транзакции
//                 await connection.execute(
//                     `UPDATE transactions 
//                     SET witness1_id = ?,
//                         witness2_id = ?
//                     WHERE id = ?`,
//                     [witness1Id, witness2Id, transactionId]
//                 );
//             }

//             await connection.commit();
//             return transactionId;
//         } catch (error) {
//             await connection.rollback();
//             throw error;
//         } finally {
//             connection.release();
//         }
//     }

//     static async createPayment(paymentData) {
//         const {
//             transaction_id,
//             amount,
//             payment_date,
//             payment_method,
//             notes,
//             receipt_file_id
//         } = paymentData;

//         const [result] = await pool.execute(
//             `INSERT INTO transaction_payments (
//                 transaction_id,
//                 amount,
//                 payment_date,
//                 payment_method,
//                 notes,
//                 receipt_file_id,
//                 status
//             ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
//             [transaction_id, amount, payment_date, payment_method, notes, receipt_file_id]
//         );

//         // Обновляем paid_amount и payment_status в transactions
//         await this.updateTransactionPaymentStatus(transaction_id);

//         return result.insertId;
//     }

//     static async updateTransactionPaymentStatus(transactionId) {
//         // Получаем общую сумму платежей
//         const [payments] = await pool.execute(
//             `SELECT 
//                 t.total_amount,
//                 COALESCE(SUM(tp.amount), 0) as total_paid
//             FROM transactions t
//             LEFT JOIN transaction_payments tp ON t.id = tp.transaction_id
//             WHERE t.id = ? AND tp.status = 'paid'
//             GROUP BY t.id, t.total_amount`,
//             [transactionId]
//         );

//         if (payments.length > 0) {
//             const { total_amount, total_paid } = payments[0];
//             let payment_status = 'not_started';
            
//             if (total_paid > 0) {
//                 payment_status = total_paid >= total_amount ? 'completed' : 'in_progress';
//             }

//             await pool.execute(
//                 `UPDATE transactions 
//                 SET paid_amount = ?,
//                     payment_status = ?
//                 WHERE id = ?`,
//                 [total_paid, payment_status, transactionId]
//             );
//         }
//     }

//     static async addFile(fileData) {
//         const {
//             transaction_id,
//             file_name,
//             original_name,
//             file_type,
//             file_path,
//             category
//         } = fileData;

//         const [result] = await pool.execute(
//             `INSERT INTO transaction_files (
//                 transaction_id,
//                 file_name,
//                 original_name,
//                 file_type,
//                 file_path,
//                 category
//             ) VALUES (?, ?, ?, ?, ?, ?)`,
//             [transaction_id, file_name, original_name, file_type, file_path, category]
//         );
//         return result.insertId;
//     }

//     static async getById(id) {
//         const [rows] = await pool.execute(
//             `SELECT 
//                 t.*,
//                 u1.name as previous_owner_name,
//                 u2.name as new_owner_name,
//                 JSON_ARRAYAGG(
//                     JSON_OBJECT(
//                         'id', tf.id,
//                         'file_name', tf.file_name,
//                         'category', tf.category
//                     )
//                 ) as files,
//                 (
//                     SELECT JSON_OBJECT(
//                         'witness1', 
//                         CASE 
//                             WHEN w1.id IS NOT NULL THEN
//                                 JSON_OBJECT(
//                                     'id', w1.id,
//                                     'name', w1.name,
//                                     'cnic', w1.cnic,
//                                     'phone', w1.phone
//                                 )
//                             ELSE NULL
//                         END,
//                         'witness2', 
//                         CASE 
//                             WHEN w2.id IS NOT NULL THEN
//                                 JSON_OBJECT(
//                                     'id', w2.id,
//                                     'name', w2.name,
//                                     'cnic', w2.cnic,
//                                     'phone', w2.phone
//                                 )
//                             ELSE NULL
//                         END
//                     )
//                     FROM transactions tr
//                     LEFT JOIN transaction_witnesses w1 
//                         ON tr.witness1_id = w1.id AND w1.witness_type = 'witness1'
//                     LEFT JOIN transaction_witnesses w2 
//                         ON tr.witness2_id = w2.id AND w2.witness_type = 'witness2'
//                     WHERE tr.id = t.id
//                     LIMIT 1
//                 ) as witnesses
//             FROM transactions t
//             LEFT JOIN users u1 ON t.previous_owner_id = u1.id
//             LEFT JOIN users u2 ON t.new_owner_id = u2.id
//             LEFT JOIN transaction_files tf ON t.id = tf.transaction_id
//             WHERE t.id = ?
//             GROUP BY t.id`,
//             [id]
//         );

//         // Преобразуем файлы в структурированный объект
//         if (rows[0]) {
//             const files = JSON.parse(rows[0].files || '[]');
//             const filesByCategory = files.reduce((acc, file) => {
//                 if (!acc[file.category]) {
//                     acc[file.category] = [];
//                 }
//                 acc[file.category].push({
//                     id: file.id,
//                     name: file.file_name,
//                     path: file.file_path,
//                     type: file.file_type,
//                     created_at: file.created_at
//                 });
//                 return acc;
//             }, {});
//             rows[0].files = filesByCategory;

//             // Преобразуем witnesses из строки в объект, если он есть
//             if (rows[0].witnesses) {
//                 rows[0].witnesses = JSON.parse(rows[0].witnesses);
//             }
//         }

//         return rows[0];
//     }

//     static async getPayments(transactionId) {
//         const [rows] = await pool.execute(
//             `SELECT 
//                 tp.*,
//                 tf.file_name as receipt_file_name,
//                 tf.file_path as receipt_file_path
//             FROM transaction_payments tp
//             LEFT JOIN transaction_files tf ON tp.receipt_file_id = tf.id
//             WHERE tp.transaction_id = ?
//             ORDER BY tp.payment_date DESC`,
//             [transactionId]
//         );
//         return rows;
//     }

//     static async isUserInvolvedInTransaction(userId, transactionId) {
//         try {
//             const [result] = await pool.query(`
//                 SELECT 
//                     CASE 
//                         WHEN previous_owner_id = ? OR new_owner_id = ? THEN true 
//                         ELSE false 
//                     END as is_involved
//                 FROM transactions 
//                 WHERE id = ?
//             `, [userId, userId, transactionId]);

//             return result[0]?.is_involved || false;
//         } catch (error) {
//             console.error('Error checking user involvement:', error);
//             return false;
//         }
//     }

//     static async getObjectTransactions(propertyId, userId) {
//         try {
//             // Получаем основную информацию о транзакциях
//             const [transactions] = await pool.query(`
//                 SELECT 
//                     t.*,
//                     COALESCE(SUM(p.amount), 0) as paid_amount,
//                     CASE 
//                         WHEN t.previous_owner_id = ? OR t.new_owner_id = ? THEN true 
//                         ELSE false 
//                     END as has_access
//                 FROM transactions t
//                 LEFT JOIN transaction_payments p ON p.transaction_id = t.id
//                 WHERE t.property_id = ?
//                 GROUP BY t.id
//                 ORDER BY t.created_at DESC
//             `, [userId, userId, propertyId]);

//             // Фильтруем транзакции и добавляем информацию о свидетелях только для доступных
//             const accessibleTransactions = [];
            
//             for (const transaction of transactions) {
//                 // Если пользователь не имеет доступа, добавляем только базовую информацию
//                 if (!transaction.has_access) {
//                     accessibleTransactions.push({
//                         id: transaction.id,
//                         status: transaction.status,
//                         created_at: transaction.created_at,
//                         has_access: false
//                     });
//                     continue;
//                 }

//                 // Для пользователей с доступом получаем полную информацию
//                 const [witnesses] = await pool.query(`
//                     SELECT 
//                         witness_type,
//                         name,
//                         cnic,
//                         phone
//                     FROM transaction_witnesses
//                     WHERE transaction_id = ?
//                 `, [transaction.id]);

//                 // Преобразуем массив свидетелей в объект
//                 transaction.witnesses = witnesses.reduce((acc, witness) => {
//                     acc[witness.witness_type] = {
//                         name: witness.name,
//                         cnic: witness.cnic,
//                         phone: witness.phone
//                     };
//                     return acc;
//                 }, {});

//                 // Добавляем флаг доступа и удаляем технические поля
//                 delete transaction.has_access;
//                 transaction.has_access = true;

//                 accessibleTransactions.push(transaction);
//             }

//             return accessibleTransactions;
//         } catch (error) {
//             console.error('Error in getObjectTransactions:', error);
//             throw error;
//         }
//     }

//     static async createTransaction(transactionData) {
//         const connection = await pool.getConnection();
//         try {
//             await connection.beginTransaction();

//             // Создаем транзакцию
//             const [result] = await connection.query(`
//                 INSERT INTO transactions 
//                 (property_id, previous_owner_id, new_owner_id, status, total_amount, payment_schedule)
//                 VALUES (?, ?, ?, ?, ?, ?)
//             `, [
//                 transactionData.property_id,
//                 transactionData.previous_owner_id,
//                 transactionData.new_owner_id,
//                 transactionData.status,
//                 transactionData.total_amount,
//                 transactionData.payment_schedule
//             ]);

//             const transactionId = result.insertId;

//             // Добавляем свидетелей, если они есть
//             if (transactionData.witnesses) {
//                 const { witness1, witness2 } = transactionData.witnesses;
                
//                 if (witness1) {
//                     await connection.query(`
//                         INSERT INTO transaction_witnesses 
//                         (transaction_id, witness_type, name, cnic, phone)
//                         VALUES (?, 'witness1', ?, ?, ?)
//                     `, [transactionId, witness1.name, witness1.cnic, witness1.phone]);
//                 }
                
//                 if (witness2) {
//                     await connection.query(`
//                         INSERT INTO transaction_witnesses 
//                         (transaction_id, witness_type, name, cnic, phone)
//                         VALUES (?, 'witness2', ?, ?, ?)
//                     `, [transactionId, witness2.name, witness2.cnic, witness2.phone]);
//                 }
//             }

//             await connection.commit();
//             return transactionId;
//         } catch (error) {
//             await connection.rollback();
//             throw error;
//         } finally {
//             connection.release();
//         }
//     }

//     static async updateWitnesses(transactionId, witnesses) {
//         const connection = await pool.getConnection();
//         try {
//             await connection.beginTransaction();

//             // Удаляем существующих свидетелей
//             await connection.query(
//                 'DELETE FROM transaction_witnesses WHERE transaction_id = ?',
//                 [transactionId]
//             );

//             // Сбрасываем ID свидетелей в транзакции
//             await connection.query(
//                 'UPDATE transactions SET witness1_id = NULL, witness2_id = NULL WHERE id = ?',
//                 [transactionId]
//             );

//             let witness1Id = null;
//             let witness2Id = null;

//             // Добавляем новых свидетелей
//             const { witness1, witness2 } = witnesses;
            
//             if (witness1) {
//                 const [w1Result] = await connection.query(
//                     `INSERT INTO transaction_witnesses 
//                     (transaction_id, witness_type, name, cnic, phone)
//                     VALUES (?, 'witness1', ?, ?, ?)`,
//                     [transactionId, witness1.name, witness1.cnic, witness1.phone]
//                 );
//                 witness1Id = w1Result.insertId;
//             }
            
//             if (witness2) {
//                 const [w2Result] = await connection.query(
//                     `INSERT INTO transaction_witnesses 
//                     (transaction_id, witness_type, name, cnic, phone)
//                     VALUES (?, 'witness2', ?, ?, ?)`,
//                     [transactionId, witness2.name, witness2.cnic, witness2.phone]
//                 );
//                 witness2Id = w2Result.insertId;
//             }

//             // Обновляем ID свидетелей в транзакции
//             await connection.query(
//                 `UPDATE transactions 
//                 SET witness1_id = ?,
//                     witness2_id = ?
//                 WHERE id = ?`,
//                 [witness1Id, witness2Id, transactionId]
//             );

//             await connection.commit();
//             return true;
//         } catch (error) {
//             await connection.rollback();
//             throw error;
//         } finally {
//             connection.release();
//         }
//     }

//     static async createTransferRequest(requestData) {
//         try {
//             const {
//                 property_id,
//                 requester_id,
//                 requester_name,
//                 requester_cnic
//             } = requestData;

//             const [result] = await pool.execute(
//                 `INSERT INTO transfer_requests (
//                     property_id,
//                     requester_id,
//                     requester_name,
//                     requester_cnic
//                 ) VALUES (?, ?, ?, ?)`,
//                 [property_id, requester_id, requester_name, requester_cnic]
//             );

//             return result.insertId;
//         } catch (error) {
//             console.error('Error creating transfer request:', error);
//             throw error;
//         }
//     }

//     static async getTransferRequests(filters = {}) {
//         try {
//             let query = `
//                 SELECT 
//                     tr.*,
//                     u.name as requester_name,
//                     u.email as requester_email
//                 FROM transfer_requests tr
//                 LEFT JOIN users u ON tr.requester_id = u.id
//                 WHERE 1=1
//             `;
            
//             const params = [];
            
//             if (filters.status) {
//                 query += ` AND tr.status = ?`;
//                 params.push(filters.status);
//             }
            
//             if (filters.property_id) {
//                 query += ` AND tr.property_id = ?`;
//                 params.push(filters.property_id);
//             }
            
//             if (filters.requester_id) {
//                 query += ` AND tr.requester_id = ?`;
//                 params.push(filters.requester_id);
//             }
            
//             query += ` ORDER BY tr.created_at DESC`;

//             const [requests] = await pool.execute(query, params);
//             return requests;
//         } catch (error) {
//             console.error('Error getting transfer requests:', error);
//             throw error;
//         }
//     }

//     static async updateTransferRequestStatus(requestId, status, adminNotes = null) {
//         try {
//             const [result] = await pool.execute(
//                 `UPDATE transfer_requests 
//                 SET status = ?,
//                     admin_notes = ?
//                 WHERE id = ?`,
//                 [status, adminNotes, requestId]
//             );
//             return result.affectedRows > 0;
//         } catch (error) {
//             console.error('Error updating transfer request:', error);
//             throw error;
//         }
//     }

//     static async getAll(page = 1, limit = 10) {
//         const offset = (page - 1) * limit;
        
//         const [rows] = await pool.execute(
//             `SELECT 
//                 t.*,
//                 u1.name as previous_owner_name,
//                 u2.name as new_owner_name,
//                 (
//                     SELECT JSON_OBJECT(
//                         'witness1', 
//                         CASE 
//                             WHEN w1.id IS NOT NULL THEN
//                                 JSON_OBJECT(
//                                     'id', w1.id,
//                                     'name', w1.name,
//                                     'cnic', w1.cnic,
//                                     'phone', w1.phone
//                                 )
//                             ELSE NULL
//                         END,
//                         'witness2', 
//                         CASE 
//                             WHEN w2.id IS NOT NULL THEN
//                                 JSON_OBJECT(
//                                     'id', w2.id,
//                                     'name', w2.name,
//                                     'cnic', w2.cnic,
//                                     'phone', w2.phone
//                                 )
//                             ELSE NULL
//                         END
//                     )
//                     FROM transactions tr
//                     LEFT JOIN transaction_witnesses w1 
//                         ON tr.witness1_id = w1.id AND w1.witness_type = 'witness1'
//                     LEFT JOIN transaction_witnesses w2 
//                         ON tr.witness2_id = w2.id AND w2.witness_type = 'witness2'
//                     WHERE tr.id = t.id
//                     LIMIT 1
//                 ) as witnesses
//             FROM transactions t
//             LEFT JOIN users u1 ON t.previous_owner_id = u1.id
//             LEFT JOIN users u2 ON t.new_owner_id = u2.id
//             ORDER BY t.created_at DESC
//             LIMIT ? OFFSET ?`,
//             [limit, offset]
//         );

//         const [totalRows] = await pool.execute('SELECT COUNT(*) as count FROM transactions');

//         // Преобразуем witnesses из строки в объект для каждой транзакции
//         const processedRows = rows.map(row => {
//             if (row.witnesses) {
//                 row.witnesses = JSON.parse(row.witnesses);
//             }
//             return row;
//         });
        
//         return {
//             transactions: processedRows,
//             total: totalRows[0].count,
//             page,
//             totalPages: Math.ceil(totalRows[0].count / limit)
//         };
//     }
// }

// export default Transaction;