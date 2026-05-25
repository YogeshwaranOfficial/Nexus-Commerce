import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getWishlist, addToWishlist, removeFromWishlist, checkWishlist, clearWishlist } from '../controllers/wishlist.controller';

const router = Router();
router.use(protect);
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.get('/check/:productId', checkWishlist);
router.delete('/', clearWishlist);

export default router;
