import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import { getProductReviews, createReview, updateReview, deleteReview, markHelpful, replyToReview } from '../controllers/review.controller';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/', protect, [
  body('productId').notEmpty(),
  body('orderId').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').trim().isLength({ min: 3, max: 100 }),
  body('body').trim().isLength({ min: 10, max: 2000 }),
  validate,
], createReview);
router.patch('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/helpful', protect, markHelpful);
router.post('/:id/reply', protect, requireRoles('seller', 'admin'), replyToReview);

export default router;
