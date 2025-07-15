import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.mjs';
import { validationResult } from 'express-validator';

const authController = {
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { login, password } = req.body;
      
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [login]);
      const user = users[0];

      if (!user || user.status === 'blocked') {
        return res.status(401).json({ message: 'Invalid credentials or account is blocked' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { password: _, created_at, phone, role, updated_at, address, ...userWithoutPassword } = user;
      
      console.log('Setting client_token cookie:', token);
      res.cookie('client_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 3*24 * 60 * 60 * 1000 // 3 days
      });

      console.log('Cookies set, sending response');
      res.json({ 
        user: userWithoutPassword,
        client_token:token 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async checkAuth(req, res) {
    try {
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
      const transaction = await pool.query(
        `SELECT id, property_id, status FROM transactions WHERE new_owner_id = ?`,
        [user?.id]
      )

      // Remove sensitive data
      const { password, ...userWithoutPassword } = user;

      res.json({ 
        isAuthenticated: true, 
        user: userWithoutPassword,
        transaction: transaction[0],
      });
    } catch (error) {
      console.error('Check auth error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          isAuthenticated: false, 
          message: 'Invalid token' 
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          isAuthenticated: false, 
          message: 'Token expired' 
        });
      }
      res.status(500).json({ 
        isAuthenticated: false, 
        message: 'Internal server error' 
      });
    }
  },

  async adminLogin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      
      const [admins] = await pool.query('SELECT * FROM auth_users WHERE email = ? AND role = ?', [email, 'admin']);
      const admin = admins[0];

      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: admin.id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set token in cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      });

      // Return only necessary user data
      const userData = {
        id: admin.id,
        email: admin.email,
        role: admin.role
      };

      res.json({ user: userData });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async validateAdminToken(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      res.json({ valid: true, user: req.user });
    } catch (error) {
      console.error('Admin token validation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async changeAdminPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { current_password, new_password } = req.body;
      const adminId = req.user.id;

      const [users] = await pool.query('SELECT password FROM auth_users WHERE id = ? AND role = ?', [adminId, 'admin']);
      const user = users[0];

      if (!user) {
        return res.status(404).json({ message: 'Administrator not found' });
      }

      const isValidPassword = await bcrypt.compare(current_password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid current password' });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      await pool.query('UPDATE auth_users SET password = ? WHERE id = ?', [hashedPassword, adminId]);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async validateAdmin(req, res) {
    try {
      const token = req.cookies.auth_token;
      if (!token) {
        return res.status(401).json({ valid: false });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Проверка администратора в таблице auth_users
      const [admins] = await pool.query(
        'SELECT id, email, role FROM auth_users WHERE id = ? AND role = ?',
        [decoded.id, 'admin']
      );

      const admin = admins[0];
      if (!admin) {
        return res.status(401).json({ valid: false });
      }

      res.json({
        valid: true,
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      res.status(401).json({ valid: false });
    }
  },

  async logout(req, res) {
    res.clearCookie('auth_token');
    res.json({ message: 'Logged out successfully' });
  }
};

export default authController; 