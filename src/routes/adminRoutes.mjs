import express from 'express';
import { getUsers, updateUserStatus, updateTransactionStatus, clearTransactionHistory } from '../controllers/adminController.mjs';
import { adminAuth } from '../middlewares/auth.mjs';
import { body } from 'express-validator';
import { create, getAll, getById, update, remove } from '../controllers/userController.mjs';
import transactionController from '../controllers/transactionController.mjs';
import Transaction from '../models/Transaction.mjs';
import pool from '../config/database.mjs';

const router = express.Router();

// Маршруты для работы с пользователями
router.post('/users', [
    adminAuth,
    body('name').notEmpty().withMessage('Enter name')
        .trim()
        .isLength({ max: 100 }).withMessage('Name should not exceed 100 characters'),
    body('login').notEmpty().withMessage('Enter login')
        .trim()
        .isLength({ max: 50 }).withMessage('Login should not exceed 50 characters'),
    body('password').isLength({ min: 6, max: 100 }).withMessage('Password must contain 6 to 100 characters'),
    body('cnic').notEmpty().withMessage('Enter CNIC')
        .trim()
        .matches(/^\d{5}-\d{7}-\d$/).withMessage('CNIC must be in XXXXX-XXXXXXX-X format')
        .isLength({ max: 15 }).withMessage('CNIC should not exceed 15 characters'),
    body('phone').optional()
        .matches(/^\+\d{12}$/).withMessage('Phone must be in +XXXXXXXXXXXX format'),
    body('address').optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Address should not exceed 255 characters')
], create);

router.get('/users', adminAuth, getUsers);
router.put('/users/:userId', [
    adminAuth,
    body('status').isIn(['active', 'blocked']).withMessage('Invalid status')
], updateUserStatus);

// Маршруты для работы со сделками
router.get('/transactions', adminAuth, transactionController.getAll);
router.put('/transactions/:transactionId', [
    adminAuth,
    body('status').isIn(['approved', 'rejected', 'cancelled']).withMessage('Invalid status'),
    body('reason').optional().isString().withMessage('Reason must be a string')
], updateTransactionStatus);

// Обновление суммы транзакции
router.put('/transactions/:transactionId/update-amount', [
    adminAuth,
    body('total_amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
], async (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId);
        const { total_amount } = req.body;

        const [result] = await pool.query(
            'UPDATE transactions SET total_amount = ? WHERE id = ?',
            [total_amount, transactionId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            message: 'Transaction amount updated successfully'
        });
    } catch (error) {
        console.error('Error updating transaction amount:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating transaction amount'
        });
    }
});

// Clear transaction history
router.post('/transactions/history/clear', [
    adminAuth,
    body('older_than').isISO8601().withMessage('Please provide a valid date'),
    body('status').isArray().withMessage('Status must be an array')
        .custom(value => value.every(status => ['approved', 'rejected', 'cancelled'].includes(status)))
        .withMessage('Invalid statuses')
], clearTransactionHistory);

// Маршруты для работы с запросами на сделку
// router.get('/transfer-requests', adminAuth, async (req, res) => {
//     try {
//         const { status } = req.query;
//         const filters = {};
//         if (status && status !== 'all') {
//             filters.status = status;
//         }

//         const requests = await Transaction.getTransferRequests(filters);
//         res.json({ success: true, requests });
//     } catch (error) {
//         console.error('Error getting transfer requests:', error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Error getting transfer requests' 
//         });
//     }
// });

router.put('/transfer-requests/:id', [
    adminAuth,
    body('status').isIn(['approved', 'rejected']).withMessage('Invalid status'),
    body('admin_notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
    try {
        const { status, admin_notes } = req.body;
        const requestId = parseInt(req.params.id);

        // Получаем информацию о запросе перед обновлением
        const [transferRequest] = await pool.query(
            'SELECT * FROM transfer_requests WHERE id = ?',
            [requestId]
        );

        if (!transferRequest || transferRequest.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transfer request not found'
            });
        }

        const success = await Transaction.updateTransferRequestStatus(
            requestId,
            status,
            admin_notes
        );

        if (success && status === 'approved') {
            // Если запрос одобрен, создаем новую транзакцию
            const request = transferRequest[0];

            // Получаем текущего владельца
            const [currentOwner] = await pool.query(`
                SELECT owner_id 
                FROM ownership_history 
                WHERE property_id = ? 
                ORDER BY from_date DESC 
                LIMIT 1
            `, [request.property_id]);

            // Создаем транзакцию
            const transactionData = {
                property_id: request.property_id,
                previous_owner_id: currentOwner[0]?.owner_id || null,
                new_owner_id: request.requester_id,
                status: 'pending',
                total_amount: 0 // Администратор установит сумму позже
            };

            const transactionId = await Transaction.create(transactionData);

            res.json({
                success: true,
                message: `Transfer request ${status} successfully and transaction created`,
                transaction_id: transactionId
            });
        } else if (success) {
            res.json({
                success: true,
                message: `Transfer request ${status} successfully`
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Transfer request not found'
            });
        }
    } catch (error) {
        console.error('Error updating transfer request:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating transfer request'
        });
    }
});

// Маршруты для работы со свидетелями транзакции
router.get('/transactions/:transactionId/witnesses', adminAuth, async (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId);

        const [witnesses] = await pool.query(
            'SELECT witness_type, name, cnic, phone FROM transaction_witnesses WHERE transaction_id = ?',
            [transactionId]
        );

        // Преобразуем массив в объект с witness1 и witness2
        const formattedWitnesses = witnesses.reduce((acc, witness) => {
            acc[witness.witness_type] = {
                name: witness.name,
                cnic: witness.cnic,
                phone: witness.phone
            };
            return acc;
        }, {});

        res.json({
            success: true,
            witnesses: formattedWitnesses
        });
    } catch (error) {
        console.error('Error getting witnesses:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting witnesses'
        });
    }
});
router.put('/transactions/:transactionId/witnesses', [
    adminAuth,
    body('witness1.name').notEmpty().withMessage('Witness 1 name is required'),
    body('witness1.cnic').notEmpty().withMessage('CNIC is required for Witness 1'),
    body('witness1.cnic').matches(/^\d{5}-\d{7}-\d$/).withMessage('Invalid CNIC format for Witness 1 (XXXXX-XXXXXXX-X)'),
    body('witness1.phone').optional().matches(/^\+\d{12}$/).withMessage('Invalid phone format for Witness 1 (+XXXXXXXXXXXX)'),
    body('witness2.name').notEmpty().withMessage('Witness 2 name is required'),
    body('witness2.cnic').notEmpty().withMessage('CNIC is required for Witness 2'),
    body('witness2.cnic').matches(/^\d{5}-\d{7}-\d$/).withMessage('Invalid CNIC format for Witness 2 (XXXXX-XXXXXXX-X)'),
    body('witness2.phone').optional().matches(/^\+\d{12}$/).withMessage('Invalid phone format for Witness 2 (+XXXXXXXXXXXX)')
], async (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId);
        const { witness1, witness2 } = req.body;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Удаляем существующих свидетелей для этой транзакции
            await connection.query(
                'DELETE FROM transaction_witnesses WHERE transaction_id = ?',
                [transactionId]
            );

            // Обработка первого свидетеля
            if (witness1) {
                // Поиск существующих свидетелей по CNIC
                let [existingWitness] = await connection.query(
                    'SELECT id FROM transaction_witnesses WHERE cnic = ? LIMIT 1',
                    [witness1.cnic]
                );

                // Если свидетель не найден, добавляем нового
                if (existingWitness.length === 0) {
                    await connection.query(
                        `INSERT INTO transaction_witnesses 
                        (name, cnic, phone) 
                        VALUES (?, ?, ?)`,
                        [witness1.name, witness1.cnic, witness1.phone || null]
                    );

                    // Получаем ID вновь созданного свидетеля
                    const [newWitness] = await connection.query(
                        'SELECT id FROM transaction_witnesses WHERE cnic = ? ORDER BY id DESC LIMIT 1',
                        [witness1.cnic]
                    );
                    existingWitness = newWitness;
                }

                // Связываем свидетеля с транзакцией
                await connection.query(
                    `INSERT INTO transaction_witnesses 
                    (transaction_id, witness_type, name, cnic, phone) 
                    VALUES (?, 'witness1', ?, ?, ?)`,
                    [
                        transactionId,
                        witness1.name,
                        witness1.cnic,
                        witness1.phone || null
                    ]
                );
            }

            // Обработка второго свидетеля (аналогично первому)
            if (witness2) {
                // Поиск существующих свидетелей по CNIC
                let [existingWitness] = await connection.query(
                    'SELECT id FROM transaction_witnesses WHERE cnic = ? LIMIT 1',
                    [witness2.cnic]
                );

                // Если свидетель не найден, добавляем нового
                if (existingWitness.length === 0) {
                    await connection.query(
                        `INSERT INTO transaction_witnesses 
                        (name, cnic, phone) 
                        VALUES (?, ?, ?)`,
                        [witness2.name, witness2.cnic, witness2.phone || null]
                    );

                    // Получаем ID вновь созданного свидетеля
                    const [newWitness] = await connection.query(
                        'SELECT id FROM transaction_witnesses WHERE cnic = ? ORDER BY id DESC LIMIT 1',
                        [witness2.cnic]
                    );
                    existingWitness = newWitness;
                }

                // Связываем свидетеля с транзакцией
                await connection.query(
                    `INSERT INTO transaction_witnesses 
                    (transaction_id, witness_type, name, cnic, phone) 
                    VALUES (?, 'witness2', ?, ?, ?)`,
                    [
                        transactionId,
                        witness2.name,
                        witness2.cnic,
                        witness2.phone || null
                    ]
                );
            }

            await connection.commit();

            res.json({
                success: true,
                message: 'Witnesses updated successfully'
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating witnesses:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating witnesses',
            details: error.message
        });
    }
});

router.get('/latest/PKR', async (req, res) => {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/PKR');
        
        if(response.status ==404||response.status==500){
            return res.status(502).json({
            success: false,
            message: response.status
        });
        }
        const data = response.json()
        return res.json({
            success: true,
            USD: data.rates.USD
        });
    } catch (e) {
        console.error(e)
        return res.status(500).json({
            success: false,
        });
    }
})

// Payment status update route
router.put('/transactions/:transactionId/payment-status', [
    adminAuth,
    body('payment_status').isIn(['pending', 'paid', 'cancelled']).withMessage('Invalid payment status')
], async (req, res) => {
    try {
        const transactionPaymentId = parseInt(req.params.transactionId);
        const { payment_status } = req.body;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Обновление статуса платежа
            await connection.query(
                'UPDATE transaction_payments SET status = ? WHERE id = ?',
                [payment_status, transactionPaymentId]
            );

            // Проверка общей суммы транзакции
            const [transaction] = await connection.query(
                'SELECT total_amount, paid_amount FROM transactions WHERE id = ?',
                [transactionPaymentId]
            );

            let statusUpdatedToCompleted = false;

            if (transaction[0] && transaction[0].total_amount === transaction[0].paid_amount) {
                // Обновление статуса транзакции до "completed"
                await connection.query(
                    'UPDATE transactions SET status = "completed" WHERE id = ?',
                    [transactionPaymentId]
                );
                statusUpdatedToCompleted = true;
            }

            await connection.commit();

            res.json({
                success: true,
                message: 'Payment status updated successfully',
                status_updated_to_completed: statusUpdatedToCompleted
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment status'
        });
    }
});

export default router; 