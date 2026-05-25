import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart, applyCoupon, removeCoupon } from '../controllers/cart.controller';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();
router.use(protect);

router.get('/', getCart);
router.post('/', [body('productId').notEmpty(), body('quantity').optional().isInt({ min: 1 }), validate], addToCart);
router.patch('/:itemId', [body('quantity').isInt({ min: 0 }), validate], updateCartItem);
router.delete('/:itemId', removeCartItem);
router.delete('/', clearCart);
router.post('/coupon', [body('code').notEmpty().trim(), validate], applyCoupon);
router.delete('/coupon', removeCoupon);

export default router;
