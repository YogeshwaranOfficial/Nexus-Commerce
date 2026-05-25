import { Request , Response } from 'express';
import mongoose from 'mongoose';
import { Wishlist } from '../models/index';
import Product from '../models/Product.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';

// ─── GET /wishlist ────────────────────────────────────────
export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await Wishlist.findOne({ user: req.user!.id }).populate({
    path: 'products',
    select: 'name slug images basePrice compareAtPrice flashSalePrice isFlashSale ratings stock brand',
    match: { isPublished: true },
  });

  res.json({
    success: true,
    data: { products: wishlist?.products || [] },
  });
});

// ─── POST /wishlist ───────────────────────────────────────
export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.body;

  const product = await Product.findOne({ _id: productId, isPublished: true });
  if (!product) throw new AppError('Product not found', 404);

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user!.id },
    { $addToSet: { products: productId } },
    { upsert: true, new: true },
  );

  // Increment wishlist count on product
  await Product.findByIdAndUpdate(productId, { $inc: { 'analytics.wishlistCount': 1 } });

  res.json({ success: true, data: { count: wishlist.products.length } });
});

// ─── DELETE /wishlist/:productId ──────────────────────────
export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user!.id },
    { $pull: { products: new mongoose.Types.ObjectId(productId) } },
    { new: true },
  );

  await Product.findByIdAndUpdate(productId, { $inc: { 'analytics.wishlistCount': -1 } });

  res.json({ success: true, data: { count: wishlist?.products.length || 0 } });
});

// ─── GET /wishlist/check/:productId ──────────────────────
export const checkWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const wishlist = await Wishlist.findOne({ user: req.user!.id });
  const isWishlisted = wishlist?.products.some(
    (id) => id.toString() === productId,
  ) || false;

  res.json({ success: true, data: { isWishlisted } });
});

// ─── DELETE /wishlist ─────────────────────────────────────
export const clearWishlist = asyncHandler(async (req: Request, res: Response) => {
  await Wishlist.findOneAndUpdate({ user: req.user!.id }, { products: [] });
  res.json({ success: true, message: 'Wishlist cleared' });
});
