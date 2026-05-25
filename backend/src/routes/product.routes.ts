// routes/product.routes.ts
import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getRelatedProducts, getFlashSales } from '../controllers/product.controller';
import { protect, requireRoles, optionalAuth } from '../middleware/auth.middleware';

const router = Router();
router.get('/', optionalAuth, getProducts);
router.get('/flash-sales', getFlashSales);
router.get('/:slug', optionalAuth, getProduct);
router.get('/:id/related', getRelatedProducts);
router.post('/', protect, requireRoles('seller', 'admin'), createProduct);
router.patch('/:id', protect, requireRoles('seller', 'admin'), updateProduct);
router.delete('/:id', protect, requireRoles('seller', 'admin'), deleteProduct);

export default router;
