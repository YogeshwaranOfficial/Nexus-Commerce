import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import { getDashboard, getSalesAnalytics, getRevenueBreakdown, getUsers, updateUser, getAdminOrders, getAdminProducts, togglePublish, getPendingReviews, approveReview } from '../controllers/admin.controller';

const router = Router();
router.use(protect, requireRoles('admin'));

router.get('/dashboard', getDashboard);
router.get('/analytics/sales', getSalesAnalytics);
router.get('/analytics/revenue', getRevenueBreakdown);
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.get('/orders', getAdminOrders);
router.get('/products', getAdminProducts);
router.patch('/products/:id/publish', togglePublish);
router.get('/reviews/pending', getPendingReviews);
router.patch('/reviews/:id/approve', approveReview);

export default router;
