import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { Coupon } from '../models/index';
import { AppError } from '../utils/AppError';

const router = Router();

// Public: validate coupon
router.post('/validate', protect, asyncHandler(async (req: any, res: any) => {
  const { code } = req.body;
  const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
  if (!coupon) throw new AppError('Invalid or expired coupon', 400);
  res.json({ success: true, data: { coupon: { code: coupon.code, type: coupon.type, value: coupon.value, description: coupon.description, minOrderValue: coupon.minOrderValue } } });
}));

// Admin CRUD
router.use(protect, requireRoles('admin'));
router.get('/', asyncHandler(async (_req: any, res: any) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json({ success: true, data: { coupons } });
}));
router.post('/', asyncHandler(async (req: any, res: any) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, data: { coupon } });
}));
router.patch('/:id', asyncHandler(async (req: any, res: any) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) throw new AppError('Coupon not found', 404);
  res.json({ success: true, data: { coupon } });
}));
router.delete('/:id', asyncHandler(async (req: any, res: any) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Coupon deleted' });
}));

export default router;
