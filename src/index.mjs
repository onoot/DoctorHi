import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import clientRoutes from './routes/clientRoutes.mjs';
import adminRoutes from './routes/adminRoutes.mjs';
import authRoutes from './routes/authRoutes.mjs';
import userRoutes from './routes/userRoutes.mjs';
import unitsRoutes from './routes/unitsRoutes.mjs';
import transactionRoutes from './routes/transactionRoutes.mjs';
import propertyRoutes from './routes/propertyRoutes.mjs';
import fs from 'fs/promises';
import fsSync from 'fs';
import https from 'https';
import compression from 'compression';
import cors from 'cors';


// Инициализация
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const app = express();
const isProduction = false;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// Статика
app.use(express.static(path.join(__dirname, 'public')));


// Легкое логирование в файл
const logsDir = path.join(__dirname, '../logs');
if (!fsSync.existsSync(logsDir)) fsSync.mkdirSync(logsDir, { recursive: true });

const logToFile = async (level, message) => {
  try {
    const logFile = path.join(logsDir, 'app.log');
    const timestamp = new Date().toISOString();
    await fs.appendFile(logFile, `[${timestamp}] [${level.toUpperCase()}] ${message}\n`);
  } catch (e) {
    console.error('Log write failed', e);
  }
};

app.use((req, res, next) => {
  logToFile('info', `${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});


// Простая отдача ACME-challenges
app.get('/.well-known/acme-challenge/:token', (req, res) => {
  const token = req.params.token;
  if (!token || /[/\\]/.test(token)) return res.status(400).send('Invalid token');
  const acmeDir = path.join(__dirname, '..', 'win-acme', 'https-acme-site', 'doctor-height.online', '.well-known', 'acme-challenge');
  const filePath = path.join(acmeDir, token);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('ACME file not found:', filePath, err);
      res.status(404).send('Challenge file not found');
    }
  });
});

// Доступ к файлам загрузок
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check с CORS заголовками
app.get('/health', async (req, res) => {
  try {
    await fs.access(path.join(__dirname, '../uploads'));
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      cors: 'enabled',
      origin: req.headers.origin 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message,
      cors: 'enabled' 
    });
  }
});
// отадть статику при запросе старницы admin

app.use('/admin', express.static(path.join(__dirname, './public/build/')));

// Подключение маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/v1/client', clientRoutes);
app.use('/api/v1/admin/users', userRoutes);
app.use('/api/v1/admin/units', unitsRoutes);
app.use('/api/v1/admin/transactions', transactionRoutes);
app.use('/api/v1/admin/properties', propertyRoutes);
app.use('/api/v1/admin', adminRoutes);

app.listen(3001, () => {
  console.log('Test server on port 3001');
});