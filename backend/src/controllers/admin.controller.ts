import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.model';
import Product from '../models/Product.model';
import Order from '../models/Order.model';
import { Review, Coupon } from '../models/index';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── GET /admin/dashboard ─────────────────────────────────
export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalUsers,
    newUsersThisMonth,
    totalOrders,
    ordersThisMonth,
    totalProducts,
    pendingReviews,
    revenueThisMonth,
    revenueLastMonth,
    recentOrders,
    orderStatusDist,
    topProducts,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', createdAt: { $gte: thisMonth } }),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: thisMonth } }),
    Product.countDocuments({ isPublished: true }),
    Review.countDocuments({ isApproved: false }),
    Order.aggregate([
      { $match: { createdAt: { $gte: thisMonth }, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: lastMonth, $lte: lastMonthEnd }, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
    Order.find()
      .sort('-createdAt')
      .limit(10)
      .populate('user', 'name email avatar')
      .select('orderNumber status pricing.total createdAt user'),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Product.find({ isPublished: true })
      .sort('-analytics.salesCount')
      .limit(5)
      .select('name images basePrice analytics.salesCount ratings'),
  ]);

  const thisMonthRevenue = revenueThisMonth[0]?.total || 0;
  const lastMonthRevenue = revenueLastMonth[0]?.total || 0;
  const revenueGrowth = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 100;

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        newUsersThisMonth,
        totalOrders,
        ordersThisMonth,
        totalProducts,
        pendingReviews,
        revenueThisMonth,
        revenueGrowth,
      },
      recentOrders,
      orderStatusDist,
      topProducts,
    },
  });
});

// ─── GET /admin/analytics/sales ───────────────────────────
export const getSalesAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;

  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const salesData = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, 'payment.status': 'paid' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 },
        avgOrder: { $avg: '$pricing.total' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    {
      $project: {
        date: {
          $dateFromParts: { year: '$_id.year', month: '$_id.month', day: '$_id.day' },
        },
        revenue: { $round: ['$revenue', 2] },
        orders: 1,
        avgOrder: { $round: ['$avgOrder', 2] },
      },
    },
  ]);

  res.json({ success: true, data: { salesData, period } });
});

// ─── GET /admin/analytics/revenue ────────────────────────
export const getRevenueBreakdown = asyncHandler(async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [revenueByCategory, paymentMethods, topSellers] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, 'payment.status': 'paid' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmpty: true } },
      {
        $group: {
          _id: { catId: '$category._id', catName: '$category.name' },
          revenue: { $sum: '$items.subtotal' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]),

    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$payment.method', count: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
    ]),

    Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, 'payment.status': 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.seller', revenue: { $sum: '$items.subtotal' }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
      { $unwind: '$seller' },
      { $project: { revenue: 1, orders: 1, 'seller.name': 1, 'seller.email': 1, 'seller.avatar': 1 } },
    ]),
  ]);

  res.json({ success: true, data: { revenueByCategory, paymentMethods, topSellers } });
});

// ─── GET /admin/users ─────────────────────────────────────
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, role, search, isActive } = req.query;
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    const regex = new RegExp(search as string, 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('name email role avatar isActive isEmailVerified loyaltyPoints createdAt lastLogin'),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { users, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } },
  });
});

// ─── PATCH /admin/users/:id ───────────────────────────────
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (role) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
    .select('name email role isActive');
  if (!user) throw new AppError('User not found', 404);

  res.json({ success: true, data: { user } });
});

// ─── GET /admin/orders ────────────────────────────────────
export const getAdminOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, search, paymentStatus } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (paymentStatus) filter['payment.status'] = paymentStatus;
  if (search) {
    filter.$or = [
      { orderNumber: new RegExp(search as string, 'i') },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('user', 'name email')
      .select('orderNumber status pricing.total payment.status payment.method createdAt user'),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { orders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } },
  });
});

// ─── GET /admin/products ──────────────────────────────────
export const getAdminProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, search, isPublished, category } = req.query;
  const filter: Record<string, unknown> = {};
  if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
  if (category) filter.category = new mongoose.Types.ObjectId(category as string);
  if (search) filter.$text = { $search: search as string };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('seller', 'name email')
      .populate('category', 'name')
      .select('name images basePrice stock isPublished isFeatured ratings seller category createdAt'),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { products, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } },
  });
});

// ─── PATCH /admin/products/:id/publish ───────────────────
export const togglePublish = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    [{ $set: { isPublished: { $not: '$isPublished' } } }],
    { new: true },
  ).select('name isPublished');
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, data: { product } });
});

// ─── GET /admin/reviews (moderation) ─────────────────────
export const getPendingReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const filter = { isApproved: false };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('user', 'name email')
      .populate('product', 'name images'),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { reviews, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } },
  });
});

// ─── PATCH /admin/reviews/:id/approve ────────────────────
export const approveReview = asyncHandler(async (_req: Request, res: Response) => {
  const review = await Review.findByIdAndUpdate(
    _req.params.id,
    { isApproved: true },
    { new: true },
  );
  if (!review) throw new AppError('Review not found', 404);
  res.json({ success: true, data: { review } });
});
