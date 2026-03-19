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

// Используем bind для привязки контекста контроллеров
router.get('/transactions', auth, transactionController.getUserTransactions.bind(transactionController));
router.get('/transactions/:id/details', authLocale, transactionController.getTransactionDetails.bind(transactionController));

// Исправляем дублирующиеся роуты
router.get('/transactions/my', authLocale, transactionController.getUserTransactions.bind(transactionController));
router.get('/my/:propertyId', authLocale, transactionController.getUserPropertyTransactions.bind(transactionController));

// Получение детальной информации о транзакции пользователя
router.get('/transactions/:id/details', authLocale, transactionController.getUserTransactionDetails.bind(transactionController));

// Роут для скачивания файла по ID
router.get('/files/:id', authLocale, async (req, res) => {
    const fileId = req.params.id;

    if (!fileId || isNaN(fileId)) {
        return res.status(400).json({ success: false, message: 'Invalid file ID' });
    }

    try {
        // Получаем информацию о файле из БД
        const [files] = await pool.query(
            `SELECT file_name, original_name, file_type, file_path FROM transaction_files WHERE id = ?`,
            [fileId]
        );

        if (files.length === 0) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const fileInfo = files[0];
        let filePath = fileInfo.file_path;

        // Определяем корневую директорию проекта
        const projectRoot = path.resolve(__dirname, '../..'); // поднимаемся из src/routes на два уровня вверх
        
        // Нормализуем путь
        if (filePath.startsWith('../../')) {
            // Убираем '../' из пути и соединяем с projectRoot
            const relativePath = filePath.replace(/^\.\.\/\.\.\//, '');
            filePath = path.join(projectRoot, relativePath);
        } else if (filePath.startsWith('../')) {
            const relativePath = filePath.replace(/^\.\.\//, '');
            filePath = path.join(projectRoot, relativePath);
        } else {
            filePath = path.join(projectRoot, filePath);
        }

        // Проверяем существование файла
        try {
            await fs.access(filePath);
        } catch (error) {
            console.error('File not found at path:', filePath);
            return res.status(404).json({ 
                success: false, 
                message: 'File not found on disk',
                path: filePath // для отладки, в продакшне уберите
            });
        }

        // Устанавливаем заголовки
        res.setHeader('Content-Type', fileInfo.file_type);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.original_name)}"`);

        // Потоковая передача
        const fileStream = createReadStream(filePath);
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