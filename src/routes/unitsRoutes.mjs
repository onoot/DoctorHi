// routes/unitsRouter.mjs
import express from 'express';
import UnitsController, { createUnitValidators, updateUnitValidators } from '../controllers/unitsController.mjs';
import { auth, adminAuth } from '../middlewares/auth.mjs';

const router = express.Router();

// Маршрут для получения всех единиц недвижимости (с фильтрацией и пагинацией)
router.get('/', adminAuth, UnitsController.getAll);

// Маршрут для получения объектов, сгруппированных по категориям (для публичного доступа)
router.get('/grouped', auth, UnitsController.getAllGroupedByCategory);

// Маршрут для получения конкретного объекта недвижимости по id
router.get('/:id', auth, UnitsController.getById);

// Маршрут для создания нового объекта недвижимости
router.post('/', adminAuth, createUnitValidators, UnitsController.create);

// Маршрут для обновления объекта недвижимости
router.put('/:id', adminAuth, updateUnitValidators, UnitsController.update);

// Маршрут для удаления объекта недвижимости
router.delete('/:id', adminAuth, UnitsController.delete);

// Маршрут для получения уникальных значений типов и категорий (для фильтров)
router.get('/filters/options', auth, UnitsController.getFilterOptions);

export default router;