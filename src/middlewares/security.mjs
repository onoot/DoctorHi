import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import path from 'path';

// Ограничение количества запросов
export const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 15 minutes
  max: 300, // Maximum 300 requests from one IP
  message: 'Too many requests from this IP, please try again later'
});

// Защита от XSS и других веб-уязвимостей
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'no-referrer' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  dnsPrefetchControl: { allow: false },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' }
});

// Защита от HTTP Parameter Pollution
export const preventHPP = hpp();

// Защита от CSRF
export const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Обработка ошибок CSRF
export const handleCSRFError = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  res.status(403).json({ message: 'Invalid CSRF token' });
};

// Фильтрация управляющих символов
const filterControlChars = (str) => {
  return str.replace(/[\x00-\x1F\x7F]/g, ''); // Удаляем все управляющие символы
};

// Защита от path traversal
export const validateFilePath = (basePath, filePath) => {
  const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolvedPath = path.resolve(basePath, normalizedPath);
  return resolvedPath.startsWith(path.resolve(basePath)) ? resolvedPath : null;
};

// Защита файловой системы
export const fileSystemSecurity = (req, res, next) => {
  // Защита от path traversal в параметрах запроса
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = filterControlChars(req.params[key]);
        if (req.params[key].includes('../') || req.params[key].includes('..\\')) {
          return res.status(400).json({ message: 'Invalid path' });
        }
      }
    });
  }

  // Защита от path traversal в query параметрах
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = filterControlChars(req.query[key]);
        if (req.query[key].includes('../') || req.query[key].includes('..\\')) {
          return res.status(400).json({ message: 'Invalid path' });
        }
      }
    });
  }

  next();
};

// Обновленная санитизация входных данных
export const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        // Фильтруем управляющие символы
        obj[key] = filterControlChars(obj[key]);
        // Удаляем HTML-теги и экранируем специальные символы
        obj[key] = obj[key]
          .replace(/<[^>]*>/g, '')
          .replace(/[<>'"]/g, char => {
            const entities = {
              '<': '&lt;',
              '>': '&gt;',
              "'": '&apos;',
              '"': '&quot;'
            };
            return entities[char];
          });
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    });
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// Проверка заголовка Content-Type
export const checkContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    if (!contentType) {
      return res.status(415).json({ 
        message: 'Content-Type header is required' 
      });
    }
    
    // Разрешаем multipart/form-data для загрузки файлов
    if (contentType.includes('multipart/form-data')) {
      return next();
    }
    
    // Для остальных запросов требуем application/json
    if (!contentType.includes('application/json')) {
      return res.status(415).json({ 
        message: 'Content type must be application/json or multipart/form-data' 
      });
    }
  }
  next();
};

// Ограничение размера запроса
export const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'], 10);
  if (contentLength > 5242880) { // 5MB
    return res.status(413).json({ 
      message: 'Request size exceeds the allowed limit' 
    });
  }
  next();
}; 