import pool from '../config/database.mjs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class AuthUser {
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [result] = await pool.execute(
      'INSERT INTO auth_users (email, password, role) VALUES (?, ?, ?)',
      [userData.email, hashedPassword, userData.role || 'user']
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM auth_users WHERE email = ?', [email]);
    return rows[0];
  }

  static async validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  static generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}

export default AuthUser; 