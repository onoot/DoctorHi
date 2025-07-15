import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './config/database.mjs';
import clientRoutes from './routes/clientRoutes.mjs';
import adminRoutes from './routes/adminRoutes.mjs';
import authRoutes from './routes/authRoutes.mjs';
import userRoutes from './routes/userRoutes.mjs';
import transactionRoutes from './routes/transactionRoutes.mjs';
import {
  limiter,
  securityHeaders,
  preventHPP,
  csrfProtection,
  handleCSRFError,
  sanitizeInput,
  checkContentType,
  requestSizeLimit
} from './middlewares/security.mjs';
import fs from 'fs/promises';
import fsNotPromise from 'fs';
import pool from './config/database.mjs';
import { auth, adminAuth } from './middlewares/auth.mjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Базовые middleware
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware безопасности
app.use(securityHeaders); // Защита от XSS и других веб-уязвимостей


// Путь к директории логов
const logsDir = path.join(__dirname, '../logs');
if (!fsNotPromise.existsSync(logsDir)) {
  fsNotPromise.mkdirSync(logsDir);
}

// Функция записи логов в файл
const logToFile = (level, message, ip) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [IP: ${ip}] ${message}\n`;
    const logFilePath = path.join(logsDir, 'app.log');

    // Асинхронная запись в файл
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Failed to write log to file:', err);
        }
    });
};

// Middleware для логирования запросов
app.use((req, res, next) => {
    req.requestId = uuidv4();

    // Получение IP-адреса клиента
    const clientIp = req.ip || req.connection.remoteAddress || 'Unknown IP';

    const logMessage = `[${req.requestId}] ${req.method} ${req.url}`;
    // console.log(logMessage); // Лог в консоль
    logToFile('info', logMessage, clientIp); // Лог в файл
    next();
});

// Error handling с записью в файл
app.use((err, req, res, next) => {
    // Получение IP-адреса клиента
    const clientIp = req.ip || req.connection.remoteAddress || 'Unknown IP';

    const errorMessage = `${err.stack || err.message}`;
    console.error(errorMessage); // Лог в консоль
    logToFile('error', errorMessage, clientIp); // Лог в файл

    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(err.status || 500).json({ message });
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
    const errorMessage = `Uncaught Exception: ${error.stack || error.message}`;
    console.error(errorMessage); // Лог в консоль
    logToFile('fatal', errorMessage, 'Server'); // Лог в файл
    process.exit(1); // Завершение процесса
});

// Обработка необработанных промисов
process.on('unhandledRejection', (reason, promise) => {
    const errorMessage = `Unhandled Rejection at: ${promise}, reason: ${reason}`;
    console.error(errorMessage); // Лог в консоль
    logToFile('fatal', errorMessage, 'Server'); // Лог в файл
    process.exit(1); // Завершение процесса
});

// Настройка CORS
app.use(cors({
  origin: '*', // Разрешаем все домены
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Разрешенные методы
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // Разрешенные заголовки
  credentials: true // Разрешаем отправку куков и заголовков авторизации
}));

// Обработка OPTIONS запросов для всех маршрутов
app.options('*', cors());
app.set('trust proxy', 1); // доверять только одному прокси
app.use(limiter); // Ограничение количества запросов
app.use(preventHPP); // Защита от HTTP Parameter Pollution
app.use(sanitizeInput); // Санитизация входных данных
app.use(checkContentType); // Проверка Content-Type
app.use(requestSizeLimit); // Ограничение размера запроса

// Статические файлы и маршруты для файлов
const uploadsPath = path.join(__dirname, '../uploads');

// Middleware для проверки доступа к файлам для пользователей
const userFileAccessMiddleware = async (req, res, next) => {
  try {
    console.log('User file access request:', {
      path: req.path,
      user: req.user,
      method: req.method
    });

    const filename = path.basename(req.path);
    // Проверяем права доступа к файлу
    const [fileInfo] = await pool.query(`
      SELECT tf.*, t.previous_owner_id, t.new_owner_id 
      FROM transaction_files tf
      JOIN transactions t ON tf.transaction_id = t.id
      WHERE tf.file_name = ?
    `, [filename]);

    if (!fileInfo.length) {
      console.log('File not found in DB');
      return res.status(404).json({ message: 'File not found' });
    }

    // Проверяем, является ли пользователь участником транзакции
    const isParticipant = 
      fileInfo[0].previous_owner_id === req.user.id || 
      fileInfo[0].new_owner_id === req.user.id;

    if (!isParticipant) {
      console.log('Access denied: not a participant');
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('User access granted');
    next();
  } catch (error) {
    console.error('File access error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware для проверки доступа к файлам для администраторов
const adminFileAccessMiddleware = async (req, res, next) => {
    try {
        console.log('Admin file access request:', {
            path: req.path,
            method: req.method,
            query: req.query
        });

        // Получаем закодированное имя файла из URL
        const encodedFilename = path.basename(req.path);
        // Декодируем имя файла
        const decodedFilename = decodeURIComponent(encodedFilename);
        
        console.log('File search:', {
            encoded: encodedFilename,
            decoded: decodedFilename
        });

        // Проверяем существование файла в базе данных, используя оба варианта имени
        const [fileData] = await pool.query(
            'SELECT tf.* FROM transaction_files tf WHERE tf.file_name = ? OR tf.file_name = ?',
            [encodedFilename, decodedFilename]
        );

        if (!fileData || fileData.length === 0) {
            console.log('File not found in database');
            return res.status(404).json({ error: 'File not found' });
        }

        const file = fileData[0];

        // Формируем полный путь к файлу, используя имя файла из базы данных
        const filePath = path.join(uploadsPath, 'transactions', file.file_name);
        
        // Проверяем существование файла на диске
        try {
            await fs.access(filePath);
        } catch (error) {
            console.error('File not found on disk:', error);
            return res.status(404).json({ error: 'File not found on disk' });
        }

        // Обработка DELETE запроса
        if (req.method === 'DELETE') {
            try {
                // Удаляем файл из базы данных
                await pool.query(
                    'DELETE FROM transaction_files WHERE id = ?',
                    [file.id]
                );

                // Удаляем файл с диска
                await fs.unlink(filePath);

                return res.json({ message: 'File deleted successfully' });
            } catch (error) {
                console.error('Error deleting file:', error);
                return res.status(500).json({ error: 'Error deleting file' });
            }
        }

        // Проверяем параметр download
        if (req.query.download === 'true') {
            console.log('Downloading file:', filePath);
            return res.download(filePath, file.original_name);
        }

        // Устанавливаем заголовки для CORS
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Credentials': 'true',
            'Cross-Origin-Resource-Policy': 'cross-origin'
        });

        // Отправляем файл
        res.sendFile(filePath);

    } catch (error) {
        console.error('Error in adminFileAccessMiddleware:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Функция для отдачи статических файлов
const serveStaticFiles = express.static(uploadsPath);

// Маршрут для доступа к файлам для пользователей
app.use('/api/uploads/user', auth, userFileAccessMiddleware, (req, res, next) => {
  if (req.filePath) {
    req.url = '/' + req.filePath;
  }
  serveStaticFiles(req, res, next);
});

// Настройка CORS для маршрутов файлов
app.options('/api/uploads/*', (req, res) => {
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true'
    }).status(200).end();
});

// Маршруты для доступа к файлам
app.use('/api/uploads/admin', adminFileAccessMiddleware);
app.use('/api/uploads', adminFileAccessMiddleware); // Для обратной совместимости

// CSRF защита для всех маршрутов, кроме API
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    csrfProtection(req, res, next);
  } else {
    next();
  }
});
app.use(handleCSRFError);
// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/v1/client', clientRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/users', userRoutes);
app.use('/api/v1/admin/transactions', transactionRoutes);

// Endpoint для проверки здоровья системы
app.get('/health', async (req, res) => {
  try {
    // Проверяем подключение к базе данных
    await pool.query('SELECT 1');
    
    // Проверяем доступность директории для загрузок
    await fs.access(path.join(__dirname, '../uploads'));
    
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    console.error('Ошибка проверки здоровья:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Don't show error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(err.status || 500).json({ message });
});

// Handle non-existent routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});


const PORT = process.env.PORT || 3000;

// Инициализация базы данных и запуск сервера
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Mode: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer(); 