import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import { getMyOrders, getOrder, checkout, updateOrderStatus, cancelOrder } from '../controllers/order.controller';

const router = Router();
router.use(protect);
router.get('/', getMyOrders);
router.get('/:id', getOrder);
router.post('/checkout', checkout);
router.post('/:id/cancel', cancelOrder);
router.patch('/:id/status', requireRoles('admin', 'seller'), updateOrderStatus);

export default router;
