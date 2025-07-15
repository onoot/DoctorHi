import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import User from '../models/User.mjs';

export const create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { name, login, password, cnic, phone, address } = req.body;

    // Check CNIC format
    const cnicRegex = /^\d{5}-\d{7}-\d$/;
    if (!cnicRegex.test(cnic)) {
      return res.status(400).json({ 
        message: 'CNIC must be in format XXXXX-XXXXXXX-X' 
      });
    }

    // Check if user exists
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = await User.create({
      name: name.trim(),
      email: login.trim(),
      password: hashedPassword,
      cnic: cnic.trim(),
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null
    });

    res.status(201).json({
      message: 'User created successfully',
      userId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Add more informative error message
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
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    const filters = {
      status,
      search,
      limit: parseInt(limit),
      offset: parseInt(offset)
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
      users: sanitizedUsers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    res.status(500).json({ message: 'Ошибка при получении списка пользователей' });
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