import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import User from '../models/User.mjs';

export const create = async (req, res) => {
  try {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ 
    //     message: 'Validation error',
    //     errors: errors.array() 
    //   });
    // }

    const { name, login, password, cnic, phone, address } = req.body;

    // Проверка существования пользователя
    const existingUserByEmail = await User.findByEmail(login);
    if (existingUserByEmail) {
      return res.status(400).json({ 
        message: 'User with this login already exists' 
      });
    }

    const existingUserByCNIC = await User.findByCNIC(cnic);
    if (existingUserByCNIC) {
      return res.status(400).json({ 
        message: 'User with this CNIC already exists' 
      });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const userId = await User.create({
      name: name.trim(),
      email: login.trim(),
      password: hashedPassword,
      cnic: cnic.trim(),
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ 
        message: 'One of the fields exceeds the maximum length',
        error: error.sqlMessage
      });
    }
    
    res.status(500).json({ 
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
    res.status(500).json({ message: 'Error when getting the list of users' });
  }
};

export const getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Error getting user' });
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
    const { newPassword } = req.body;

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

    // Обновляем пароль в БД
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { password: newPassword } // Хэширование происходит внутри findByIdAndUpdate
    );

    // Проверяем, успешно ли обновление
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found or update failed'
      });
    }

    // Удаляем пароль из ответа
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'Password updated successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = {};

    // Check each field separately
    if (req.body.email) {
      const existingUser = await User.findByEmail(req.body.email);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      updateData.email = req.body.email;
    }

    if (req.body.cnic) {
      const existingUser = await User.findByCNIC(req.body.cnic);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ message: 'CNIC is already in use' });
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
      return res.status(404).json({ message: 'User not found or data has not changed' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

export const remove = async (req, res) => {
  try {
    const success = await User.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'User not found or cannot be deleted' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
}; 