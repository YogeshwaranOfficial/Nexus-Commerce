import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import { getSellerDashboard, getSellerProducts, getSellerOrders, getSellerAnalytics, updateInventory } from '../controllers/seller.controller';

const router = Router();
router.use(protect, requireRoles('seller', 'admin'));

router.get('/dashboard', getSellerDashboard);
router.get('/products', getSellerProducts);
router.get('/orders', getSellerOrders);
router.get('/analytics', getSellerAnalytics);
router.patch('/products/:id/inventory', updateInventory);

export default router;
