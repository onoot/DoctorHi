// User.mjs - обновленная версия с поддержкой login и email

import pool from '../config/database.mjs';
import bcrypt from 'bcryptjs';

class User {
  static async create(userData) {
    if (!userData || typeof userData !== 'object') {
      throw new Error('Invalid user data provided');
    }

    const { name, login, email, password, cnic, phone, address } = userData;

    // Проверяем, что передан хотя бы один из: login или email
    if (!login && !email) {
      throw new Error('Either login or email is required');
    }

    if (!name || !password || !cnic) {
      throw new Error('Missing required fields: name, password, cnic are required');
    }

    // Используем login для входа, если он предоставлен, иначе email
    const userLogin = login || email;
    const userEmail = email || null;

    const [result] = await pool.execute(
      `INSERT INTO users (
        name,
        login,
        email,
        password,
        cnic,
        phone,
        address,
        status,
        role,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        userLogin,
        userEmail,
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

  static async findByLogin(login) {
    if (!login) {
      throw new Error('Login is required for search');
    }
    
    // Ищем по логину или email (для обратной совместимости)
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE login = ? OR email = ? LIMIT 1',
      [login, login]
    );
    return rows[0];
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
    
    if (userData.login) {
      updates.push('login = ?');
      values.push(userData.login.trim());
    }
    
    if (userData.email !== undefined) {
      updates.push('email = ?');
      values.push(userData.email ? userData.email.trim().toLowerCase() : null);
    }
    
    if (userData.password) {
      updates.push('password = ?');
      values.push(await bcrypt.hash(userData.password, 10));
    }
    
    if (userData.cnic) {
      updates.push('cnic = ?');
      values.push(userData.cnic.trim());
    }
    
    if (userData.phone !== undefined) {
      updates.push('phone = ?');
      values.push(userData.phone ? userData.phone.trim() : null);
    }
    
    if (userData.address !== undefined) {
      updates.push('address = ?');
      values.push(userData.address ? userData.address.trim() : null);
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

    try {
      if (filters.status) {
        query += ' AND status = ?';
        values.push(filters.status);
      }

      if (filters.search) {
        query += ' AND (name LIKE ? OR cnic LIKE ? OR login LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY created_at DESC';

      // Всегда добавляем LIMIT и OFFSET правильно
      const limit = Math.max(1, parseInt(filters.limit) || 10);
      const offset = Math.max(0, parseInt(filters.offset) || 0);

      query += ' LIMIT ? OFFSET ?';
      values.push(limit, offset);

      console.log('Executing query:', query);
      console.log('With values:', values);

      const [rows] = await pool.query(query, values);
      
      // Удаляем пароли из результатов
      return rows.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
    } catch (e) {
      console.error('User.getAll ERROR:', {
        message: e.message,
        code: e.code,
        errno: e.errno,
        sql: query,
        values: values,
        filters: filters
      });
      throw e;
    }
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE role = "user"';
    const values = [];

    try {
      if (filters.status) {
        query += ' AND status = ?';
        values.push(filters.status);
      }

      if (filters.search) {
        query += ' AND (name LIKE ? OR cnic LIKE ? OR login LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      const [rows] = await pool.execute(query, values);
      return rows[0].count;
    } catch (e) {
      console.error('User.count ERROR:', e);
      throw e;
    }
  }

  static async findByIdAndUpdate(id, userData) {
    if (!id) {
      throw new Error('ID is required for update');
    }

    if (!userData || typeof userData !== 'object' || Object.keys(userData).length === 0) {
      throw new Error('Valid user data is required for update');
    }

    try {
      // Подготавливаем поля для обновления
      const updates = [];
      const values = [];
      const allowedFields = ['name', 'login', 'email', 'password', 'cnic', 'phone', 'address', 'status'];

      // Проверяем и добавляем разрешенные поля для обновления
      for (const field of allowedFields) {
        if (userData[field] !== undefined) {
          if (field === 'password') {
            // Хэшируем пароль перед сохранением
            const hashedPassword = await bcrypt.hash(userData[field], 10);
            updates.push(`${field} = ?`);
            values.push(hashedPassword);
          } else if (field === 'email') {
            // Приводим email к нижнему регистру
            updates.push(`${field} = ?`);
            values.push(userData[field] ? userData[field].trim().toLowerCase() : null);
          } else if (field === 'login') {
            updates.push(`${field} = ?`);
            values.push(userData[field].trim());
          } else {
            updates.push(`${field} = ?`);
            values.push(userData[field]);
          }
        }
      }

      // Добавляем updated_at
      updates.push('updated_at = NOW()');

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Добавляем ID в конец значений для WHERE clause
      values.push(id);

      // Выполняем UPDATE запрос
      const [result] = await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ? AND role = ?`,
        [...values, 'user']
      );

      // Если ничего не обновлено, пользователь не найден
      if (result.affectedRows === 0) {
        return null;
      }

      // Возвращаем обновленного пользователя
      const updatedUser = await this.findById(id);
      // Удаляем пароль из результата
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;

    } catch (error) {
      console.error('Error in findByIdAndUpdate:', error);
      throw error;
    }
  }
}

export default User;