import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller';

const router = Router();
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
router.post('/', protect, requireRoles('admin'), createCategory);
router.patch('/:id', protect, requireRoles('admin'), updateCategory);
router.delete('/:id', protect, requireRoles('admin'), deleteCategory);

export default router;
