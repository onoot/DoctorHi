import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import pool from '../config/database.mjs';

export const auth = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Check user in users table
    const [users] = await pool.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);
    const user = users[0];

    if (!user || user.status === 'blocked') {
      return res.status(401).json({ message: 'User not found or blocked' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export async function authLocale(req, res, next) {
  try{
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ isAuthenticated: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is not blocked
    const [users] = await pool.query(
      'SELECT id, name, cnic, email, role, status FROM users WHERE id = ?',
      [decoded.id]
    );
    
    const user = users[0];
    if (!user || user.status === 'blocked') {
      return res.status(401).json({ 
        isAuthenticated: false, 
        message: 'User not found or blocked' 
      });
    }

    next();
  }catch(e){
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Check admin in auth_users table
    const [admins] = await pool.query('SELECT id, email, role FROM auth_users WHERE id = ? AND role = ?', [decoded.id, 'admin']);
    const admin = admins[0];

    if (!admin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.user = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const validateToken = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Check admin in auth_users table
    const [admins] = await pool.query('SELECT id, email, role FROM auth_users WHERE id = ? AND role = ?', [decoded.id, 'admin']);
    const admin = admins[0];

    if (!admin) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const validateTokenAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Error token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Проверяем существование и статус пользователя
    const [users] = await pool.query('SELECT id, name, email, role, status FROM auth_users WHERE id = ?', [decoded.id]);
    const user = users[0];

    if (!user || user.status === 'blocked') {
      return res.status(401).json({ message: 'User not found or blocked' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalid' });
  }
}; 