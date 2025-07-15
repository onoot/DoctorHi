import pool from '../config/database.mjs';
import bcrypt from 'bcryptjs';

class User {
  static async create(userData) {
    if (!userData || typeof userData !== 'object') {
      throw new Error('Invalid user data provided');
    }

    const { name, email, password, cnic, phone, address } = userData;

    if (!name || !email || !password || !cnic) {
      throw new Error('Missing required fields');
    }

    const [result] = await pool.execute(
      `INSERT INTO users (
        name,
        email,
        password,
        cnic,
        phone,
        address,
        status,
        role,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        email,
        password,
        cnic,
        phone || null,
        address || null,
        'active',
        'user'
      ]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    if (!email) {
      throw new Error('Email is required for search');
    }
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase()]
    );
    return rows[0];
  }

  static async findById(id) {
    if (!id) {
      throw new Error('ID is required for search');
    }
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0];
  }

  static async findByCNIC(cnic) {
    if (!cnic) {
      throw new Error('CNIC is required for search');
    }
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE cnic = ? LIMIT 1',
      [cnic]
    );
    return rows[0];
  }

  static async update(id, userData) {
    if (!id) {
      throw new Error('ID is required for update');
    }

    const updates = [];
    const values = [];

    if (userData.name) {
      updates.push('name = ?');
      values.push(userData.name.trim());
    }
    if (userData.email) {
      updates.push('email = ?');
      values.push(userData.email.trim().toLowerCase());
    }
    if (userData.password) {
      updates.push('password = ?');
      values.push(await bcrypt.hash(userData.password, 10));
    }
    if (userData.cnic) {
      updates.push('cnic = ?');
      values.push(userData.cnic.trim());
    }
    if (userData.phone) {
      updates.push('phone = ?');
      values.push(userData.phone.trim());
    }
    if (userData.address) {
      updates.push('address = ?');
      values.push(userData.address.trim());
    }
    if (userData.status) {
      updates.push('status = ?');
      values.push(userData.status);
    }

    if (updates.length === 0) {
      return false;
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async delete(id) {
    if (!id) {
      throw new Error('ID is required for deletion');
    }
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ? AND role = ?',
      [id, 'user']
    );
    return result.affectedRows > 0;
  }

  static async getAll(filters = {}) {
    let query = 'SELECT * FROM users WHERE role = "user"';
    const values = [];

    if (filters.status) {
      query += ' AND status = ?';
      values.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR cnic LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      values.push(parseInt(filters.limit));

      if (filters.offset) {
        query += ' OFFSET ?';
        values.push(parseInt(filters.offset));
      }
    }

    const [rows] = await pool.execute(query, values);
    return rows;
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE role = "user"';
    const values = [];

    if (filters.status) {
      query += ' AND status = ?';
      values.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR cnic LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const [rows] = await pool.execute(query, values);
    return rows[0].count;
  }
}

export default User; 