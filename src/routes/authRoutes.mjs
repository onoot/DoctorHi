import express from 'express';
import authController from '../controllers/authController.mjs';
import { body } from 'express-validator';
import { validateToken } from '../middlewares/auth.mjs';

const router = express.Router();

router.post('/login', [
  body('login').notEmpty().withMessage('Please enter login'),
  body('password').notEmpty().withMessage('Please enter password')
], authController.login);

// Add check-auth route
router.get('/check-auth', authController.checkAuth);

// Admin panel routes
router.post('/admin/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Please enter password')
], authController.adminLogin);

// Token validation
router.get('/admin/validate', validateToken, authController.validateAdminToken);

// Admin password change route
router.post('/admin/change-password', validateToken, [
  body('current_password').notEmpty().withMessage('Please enter current password'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], authController.changeAdminPassword);

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Logged out successfully' });
});

export default router; 