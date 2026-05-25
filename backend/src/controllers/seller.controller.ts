import { Request, Response } from 'express';
import Product from '../models/Product.model';
import Order from '../models/Order.model';
import { Review } from '../models/index';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── GET /seller/dashboard ────────────────────────────────
export const getSellerDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sellerId = req.user!.id;
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [
    totalProducts,
    publishedProducts,
    totalOrderItems,
    monthRevenue,
    recentOrders,
    lowStockProducts,
    topProducts,
  ] = await Promise.all([
    Product.countDocuments({ seller: sellerId }),
    Product.countDocuments({ seller: sellerId, isPublished: true }),

    Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.seller': req.user!.id, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$items.subtotal' }, count: { $sum: 1 } } },
    ]),

    Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.seller': req.user!.id, 'payment.status': 'paid', createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, revenue: { $sum: '$items.subtotal' } } },
    ]),

    Order.find({ 'items.seller': req.user!.id })
      .sort('-createdAt')
      .limit(10)
      .populate('user', 'name email avatar')
      .select('orderNumber status pricing.total createdAt user items'),

    Product.find({ seller: sellerId, isPublished: true, stock: { $lte: 5 } })
      .sort('stock')
      .limit(5)
      .select('name images stock sku'),

    Product.find({ seller: sellerId })
      .sort('-analytics.salesCount')
      .limit(5)
      .select('name images basePrice analytics ratings'),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalProducts,
        publishedProducts,
        totalRevenue: totalOrderItems[0]?.total || 0,
        totalOrders: totalOrderItems[0]?.count || 0,
        monthRevenue: monthRevenue[0]?.revenue || 0,
      },
      recentOrders,
      lowStockProducts,
      topProducts,
    },
  });
});

// ─── GET /seller/products ─────────────────────────────────
export const getSellerProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, isPublished, search } = req.query;
  const filter: Record<string, unknown> = { seller: req.user!.id };
  if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
  if (search) filter.$text = { $search: search as string };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('category', 'name')
      .select('name images basePrice stock isPublished isFeatured ratings category createdAt analytics'),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { products, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } },
  });
});

// ─── GET /seller/orders ───────────────────────────────────
export const getSellerOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter: Record<string, unknown> = { 'items.seller': req.user!.id };
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('user', 'name email')
      .select('orderNumber status pricing payment items shippingAddress createdAt user'),
    Order.countDocuments(filter),
  ]);

  // Filter items to only show this seller's items
  const filteredOrders = orders.map((order) => {
    const orderObj = order.toObject();
    orderObj.items = orderObj.items.filter(
      (item: any) => item.seller.toString() === req.user!.id,
    );
    return orderObj;
  });

  res.json({
    success: true,
    data: { orders: filteredOrders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } },
  });
});

// ─── GET /seller/analytics ────────────────────────────────
export const getSellerAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { period = '30d' } = req.query;
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const salesData = await Order.aggregate([
    { $match: { 'items.seller': req.user!.id, 'payment.status': 'paid', createdAt: { $gte: startDate } } },
    { $unwind: '$items' },
    { $match: { 'items.seller': req.user!.id } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$items.subtotal' },
        orders: { $sum: 1 },
        units: { $sum: '$items.quantity' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data: { salesData, period } });
});

// ─── PATCH /seller/products/:id/inventory ────────────────
export const updateInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { stock, variantUpdates } = req.body;
  const product = await Product.findOne({ _id: req.params.id, seller: req.user!.id });
  if (!product) throw new AppError('Product not found', 404);

  if (stock !== undefined) product.stock = stock;

  if (variantUpdates && Array.isArray(variantUpdates)) {
    variantUpdates.forEach(({ variantId, stock: variantStock }: { variantId: string; stock: number }) => {
      const variant = product.variants.find((v) => v._id?.toString() === variantId || v.sku === variantId);
      if (variant) variant.stock = variantStock;
    });
    // Recalculate total stock
    product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  }

  await product.save();
  res.json({ success: true, data: { product } });
});
