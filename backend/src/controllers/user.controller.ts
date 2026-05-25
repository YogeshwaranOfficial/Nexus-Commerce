import { Request, Response } from 'express';
import User from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── GET /users/profile ───────────────────────────────────
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

// ─── PATCH /users/profile ─────────────────────────────────
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const allowed = ['name', 'phone', 'preferences'];
  const updates: Record<string, unknown> = {};
  allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

  const user = await User.findByIdAndUpdate(req.user!.id, updates, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);

  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

// ─── PATCH /users/avatar ──────────────────────────────────
export const updateAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.body.avatarUrl) throw new AppError('Avatar URL required', 400);
  const user = await User.findByIdAndUpdate(req.user!.id, { avatar: req.body.avatarUrl }, { new: true });
  res.json({ success: true, data: { avatar: user?.avatar } });
});

// ─── PATCH /users/password ────────────────────────────────
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!.id).select('+password');
  if (!user) throw new AppError('User not found', 404);

  if (!user.password) throw new AppError('No password set. Use OAuth to login.', 400);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

// ─── GET /users/addresses ─────────────────────────────────
export const getAddresses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id).select('addresses');
  res.json({ success: true, data: { addresses: user?.addresses || [] } });
});

// ─── POST /users/addresses ────────────────────────────────
export const addAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError('User not found', 404);

  if (user.addresses.length >= 5) throw new AppError('Maximum 5 addresses allowed', 400);

  // If this is the first address or isDefault requested, unset others
  if (req.body.isDefault || user.addresses.length === 0) {
    user.addresses.forEach((addr) => { addr.isDefault = false; });
    req.body.isDefault = true;
  }

  user.addresses.push(req.body);
  await user.save();

  res.status(201).json({ success: true, data: { addresses: user.addresses } });
});

// ─── PATCH /users/addresses/:addressId ───────────────────
export const updateAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError('User not found', 404);

  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new AppError('Address not found', 404);

  if (req.body.isDefault) {
    user.addresses.forEach((addr) => { addr.isDefault = false; });
  }

  Object.assign(address, req.body);
  await user.save();

  res.json({ success: true, data: { addresses: user.addresses } });
});

// ─── DELETE /users/addresses/:addressId ──────────────────
export const deleteAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError('User not found', 404);

  const addr = user.addresses.id(req.params.addressId);
  if (!addr) throw new AppError('Address not found', 404);

  user.addresses.pull(req.params.addressId);

  // If deleted was default, make first remaining default
  if (addr.isDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  res.json({ success: true, data: { addresses: user.addresses } });
});

// ─── PATCH /users/addresses/:addressId/default ───────────
export const setDefaultAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError('User not found', 404);

  user.addresses.forEach((addr) => {
    addr.isDefault = addr._id?.toString() === req.params.addressId;
  });
  await user.save();

  res.json({ success: true, data: { addresses: user.addresses } });
});
