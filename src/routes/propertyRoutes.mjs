// routes/propertyRoutes.mjs
import express from 'express';
import propertyController from '../controllers/propertyController.mjs';
import { auth, adminAuth } from '../middlewares/auth.mjs';

const router = express.Router();

// Все маршруты защищены аутентификацией и требуют роли администратора
router.get('/', adminAuth, propertyController.getAll);
router.get('/:id', adminAuth, propertyController.getById);
router.post('/', adminAuth, propertyController.create);
router.put('/:id', adminAuth, propertyController.update);
router.delete('/:id', adminAuth, propertyController.delete);
export default router;