import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getProfile, updateProfile, updateAvatar, changePassword, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/user.controller';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const router = Router();
router.use(protect);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/avatar', updateAvatar);
router.patch('/password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validate,
], changePassword);
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.patch('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);
router.patch('/addresses/:addressId/default', setDefaultAddress);

export default router;
