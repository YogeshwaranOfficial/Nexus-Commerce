import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Review } from '../models/index';
import Product from '../models/Product.model';
import Order from '../models/Order.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';

// ─── GET /reviews/product/:productId ─────────────────────
export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, sort = '-createdAt', rating } = req.query;

  const filter: Record<string, unknown> = {
    product: new mongoose.Types.ObjectId(productId),
    isApproved: true,
  };
  if (rating) filter.rating = Number(rating);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort(sort as string)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('user', 'name avatar'),
    Review.countDocuments(filter),
  ]);

  // Rating distribution
  const distribution = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      distribution: distribution.reduce((acc, d) => ({ ...acc, [d._id]: d.count }), {}),
    },
  });
});

// ─── POST /reviews ────────────────────────────────────────
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { productId, orderId, rating, title, body } = req.body;

  // Must have purchased the product
  const order = await Order.findOne({
    _id: orderId,
    user: req.user!.id,
    status: 'delivered',
    'items.product': productId,
  });
  if (!order) throw new AppError('You can only review products you have purchased and received', 403);

  const existing = await Review.findOne({ product: productId, user: req.user!.id });
  if (existing) throw new AppError('You have already reviewed this product', 409);

  const review = await Review.create({
    product: productId,
    user: req.user!.id,
    order: orderId,
    rating,
    title,
    body,
    images: req.body.images || [],
    isVerifiedPurchase: true,
    isApproved: true, // auto-approve; set false for moderation flow
  });

  // Recalculate product rating
  await _recalculateRating(productId);

  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, data: { review } });
});

// ─── PATCH /reviews/:id ───────────────────────────────────
export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user!.id });
  if (!review) throw new AppError('Review not found', 404);

  const { rating, title, body } = req.body;
  if (rating) review.rating = rating;
  if (title) review.title = title;
  if (body) review.body = body;
  await review.save();

  if (rating) await _recalculateRating(review.product.toString());

  res.json({ success: true, data: { review } });
});

// ─── DELETE /reviews/:id ──────────────────────────────────
export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = { _id: req.params.id };
  if (req.user!.role !== 'admin') filter.user = req.user!.id;

  const review = await Review.findOneAndDelete(filter);
  if (!review) throw new AppError('Review not found', 404);

  await _recalculateRating(review.product.toString());
  res.json({ success: true, message: 'Review deleted' });
});

// ─── POST /reviews/:id/helpful ────────────────────────────
export const markHelpful = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const hasVoted = review.helpfulVotes.some((id) => id.equals(userId));

  if (hasVoted) {
    review.helpfulVotes = review.helpfulVotes.filter((id) => !id.equals(userId));
  } else {
    review.helpfulVotes.push(userId);
  }
  await review.save();

  res.json({ success: true, data: { helpful: review.helpfulVotes.length, voted: !hasVoted } });
});

// ─── PATCH /reviews/:id/reply (seller) ───────────────────
export const replyToReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id).populate('product', 'seller');
  if (!review) throw new AppError('Review not found', 404);

  const product = review.product as any;
  if (req.user!.role !== 'admin' && product.seller.toString() !== req.user!.id) {
    throw new AppError('Unauthorized', 403);
  }

  review.sellerReply = { message: req.body.message, repliedAt: new Date() };
  await review.save();

  res.json({ success: true, data: { review } });
});

// ─── Helper: recalculate product rating ──────────────────
async function _recalculateRating(productId: string) {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), isApproved: true } },
    {
      $group: {
        _id: null,
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const distribution = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  const dist = distribution.reduce((acc: Record<string, number>, d) => {
    acc[d._id] = d.count;
    return acc;
  }, {});

  await Product.findByIdAndUpdate(productId, {
    'ratings.average': stats[0] ? Math.round(stats[0].average * 10) / 10 : 0,
    'ratings.count': stats[0]?.count || 0,
    'ratings.distribution': dist,
  });
}
