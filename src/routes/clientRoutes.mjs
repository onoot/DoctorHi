import express from 'express';
import authController from '../controllers/authController.mjs';
import transactionController from '../controllers/transactionController.mjs';
import { auth, authLocale, validateToken } from '../middlewares/auth.mjs';
import { body, query } from 'express-validator';

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs'; 

import pool from '../config/database.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get('/transactions', auth, transactionController.getUserTransactions);
router.get('/transactions/:id/details', authLocale, transactionController.getTransactionDetails);

router.get('/transactions/my', transactionController.getUserTransactions);
router.get('/my/:propertyId', authLocale, transactionController.getUserPropertyTransactions);
router.put('/my/:id', authLocale, [
    body('status').isIn(['pending', 'cancelled']).withMessage('Invalid status')
], transactionController.updateUserTransaction);

// Роут для скачивания файла по ID
router.get('/files/:id', authLocale, async (req, res) => {
    const fileId = req.params.id;

    if (!fileId || isNaN(fileId)) {
        return res.status(400).json({ success: false, message: 'Invalid file ID' });
    }

    try {
        // Получаем информацию о файле из БД — через pool.query
        const [files] = await pool.query(
            `SELECT file_name, original_name, file_type, file_path FROM transaction_files WHERE id = ?`,
            [fileId]
        );

        if (files.length === 0) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const fileInfo = files[0];
        let filePath = fileInfo.file_path;

        // Нормализуем путь
        if (filePath.startsWith('../../../')) {
            filePath = path.join(__dirname, '..', '..', filePath.replace('../../../', ''));
        } else if (filePath.startsWith('../')) {
            filePath = path.join(__dirname, '..', filePath);
        } else {
            filePath = path.join(__dirname, filePath);
        }

        // Проверяем существование файла
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ success: false, message: 'File not found on disk' });
        }

        // Устанавливаем заголовки
        res.setHeader('Content-Type', fileInfo.file_type);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.original_name)}"`);

        // Потоковая передача — ИСПРАВЛЕНО
        const fileStream = createReadStream(filePath); // <-- ВОТ ТУТ ИСПРАВЛЕНИЕ
        fileStream.pipe(res);

        fileStream.on('error', (err) => {
            console.error('Error streaming file:', err);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Error reading file' });
            }
        });

    } catch (error) {
        console.error('Database or file system error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;