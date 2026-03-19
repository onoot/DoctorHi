import bcrypt from 'bcryptjs';
import pool from '../config/database.mjs';
import { validationResult } from 'express-validator';
import User from '../models/User.mjs';

export const create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { name, login, email, password, cnic, phone, address, property_id } = req.body;

    // Проверка: должен быть хотя бы login или email
    if (!login && !email) {
      return res.status(400).json({ 
        success: false,
        message: 'Either login or email is required' 
      });
    }

    // Определяем логин и email
    let finalLogin = login;
    let finalEmail = email;

    // Если передан login, но он выглядит как email - дублируем в email
    if (login && login.includes('@') && !email) {
      finalEmail = login.toLowerCase();
    }
    
    // Если передан email, но нет login - используем часть email как login
    if (email && !login) {
      finalLogin = email.split('@')[0];
    }

    // Проверка существования пользователя по логину
    if (finalLogin) {
      const existingUserByLogin = await User.findByLogin(finalLogin);
      if (existingUserByLogin) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this login already exists' 
        });
      }
    }

    // Проверка существования пользователя по email
    if (finalEmail) {
      const existingUserByEmail = await User.findByEmail(finalEmail);
      if (existingUserByEmail) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this email already exists' 
        });
      }
    }

    // Проверка CNIC
    if (!cnic) {
      return res.status(400).json({ 
        success: false,
        message: 'CNIC is required' 
      });
    }

    const existingUserByCNIC = await User.findByCNIC(cnic);
    if (existingUserByCNIC) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this CNIC already exists' 
      });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const userId = await User.create({
      name: name ? name.trim() : null,
      login: finalLogin ? finalLogin.trim() : null,
      email: finalEmail ? finalEmail.trim().toLowerCase() : null,
      password: hashedPassword,
      cnic: cnic.trim(),
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null
    });

    // Если указан property_id — создаём запись в transactions
    if (property_id) {
      try {
        // Получаем информацию о юните, включая цену
        const [unitRows] = await pool.query(
          'SELECT id, name, price, area FROM units WHERE id = ?',
          [property_id]
        );

        // Проверяем, существует ли уже транзакция для этого property_id
        const [existingTransaction] = await pool.query(
          'SELECT id FROM transactions WHERE property_id = ?',
          [property_id]
        );

        // Определяем сумму сделки
        let totalAmount = 0;
        if (unitRows.length > 0 && unitRows[0].price) {
          totalAmount = unitRows[0].price;
        }

        if (existingTransaction.length > 0) {
          // Обновляем существующую транзакцию
          await pool.query(
            `UPDATE transactions 
             SET new_owner_id = ?, 
                 total_amount = GREATEST(total_amount, ?),
                 updated_at = CURRENT_TIMESTAMP 
             WHERE property_id = ?`,
            [userId, totalAmount, property_id]
          );
        } else {
          // Создаем новую транзакцию с ценой из units, если она есть
          await pool.query(
            `INSERT INTO transactions (
              property_id, 
              new_owner_id, 
              status,
              payment_type,
              total_amount,
              paid_amount,
              payment_status,
              created_at,
              updated_at
            ) VALUES (?, ?, 'pending', 'full', ?, 0.00, 'in_progress', NOW(), NOW())`,
            [property_id, userId, totalAmount]
          );
        }

        // Добавляем запись в ownership_history
        await pool.query(
          `INSERT INTO ownership_history (property_id, owner_id, from_date)
           VALUES (?, ?, NOW())`,
          [property_id, userId]
        );

      } catch (e) {
        console.warn('Failed to add transaction for new user:', e);
        // Не возвращаем ошибку, так как пользователь уже создан
      }
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      // Пытаемся определить, какое поле дублируется
      if (error.sqlMessage.includes('login')) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this login already exists' 
        });
      }
      if (error.sqlMessage.includes('email')) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this email already exists' 
        });
      }
      if (error.sqlMessage.includes('cnic')) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this CNIC already exists' 
        });
      }
      return res.status(400).json({ 
        success: false,
        message: 'Duplicate entry - user already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const getAll = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const offset = (page-1) * limit;

    const filters = {
      status: status || 'active',
      search: search || '',
      limit: limit > 0 ? limit : 10,
      offset: offset >= 0 ? offset : 0
    };

    const [users, total] = await Promise.all([
      User.getAll(filters),
      User.count(filters)
    ]);

    // Удаляем пароли из результатов
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      success: true,
      users: sanitizedUsers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error when getting the list of users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error when getting the list of users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Администратор меняет пароль пользователя
 * @param {Object} req - Запрос
 * @param {Object} res - Ответ
 */
export const updatePassword = async (req, res) => {
  try {
    const { id } = req.params; // ID пользователя, чей пароль меняем
    const { password: newPassword } = req.body;

    // Проверяем, что пароль передан
    if (!newPassword || newPassword.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    // Проверяем, существует ли пользователь
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль в БД
    const success = await User.update(id, { password: hashedPassword });
    
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const updateData = {};

    // Check each field separately
    if (req.body.email) {
      const existingUser = await User.findByEmail(req.body.email);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ 
          success: false,
          message: 'Email is already in use' 
        });
      }
      updateData.email = req.body.email;
    }

    if (req.body.cnic) {
      const existingUser = await User.findByCNIC(req.body.cnic);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ 
          success: false,
          message: 'CNIC is already in use' 
        });
      }
      updateData.cnic = req.body.cnic;
    }

    if (req.body.name) {
      updateData.name = req.body.name;
    }

    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }

    if (req.body.status) {
      updateData.status = req.body.status;
    }

    const success = await User.update(id, updateData);
    if (!success) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found or data has not changed' 
      });
    }

    // Получаем обновленного пользователя для ответа
    const updatedUser = await User.findById(id);
    if (updatedUser) {
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ 
        success: true,
        message: 'User updated successfully',
        user: userWithoutPassword
      });
    } else {
      res.json({ 
        success: true,
        message: 'User updated successfully'
      });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const remove = async (req, res) => {
  try {
    const success = await User.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found or cannot be deleted' 
      });
    }
    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};