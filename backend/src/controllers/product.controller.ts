import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { emitInventoryUpdate } from '../config/socket';
import { slugify } from '../utils/slugify';

// ─── GET /products ────────────────────────────────────────
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    category,
    brand,
    minPrice,
    maxPrice,
    rating,
    tags,
    search,
    isFeatured,
    isFlashSale,
    seller,
    inStock,
  } = req.query;

  const filter: Record<string, unknown> = { isPublished: true };

  if (category) filter.category = new mongoose.Types.ObjectId(category as string);
  if (brand) filter.brand = { $in: (brand as string).split(',') };
  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) (filter.basePrice as any).$gte = Number(minPrice);
    if (maxPrice) (filter.basePrice as any).$lte = Number(maxPrice);
  }
  if (rating) filter['ratings.average'] = { $gte: Number(rating) };
  if (tags) filter.tags = { $in: (tags as string).split(',') };
  if (isFeatured === 'true') filter.isFeatured = true;
  if (isFlashSale === 'true') {
    filter.isFlashSale = true;
    filter.flashSaleEndsAt = { $gt: new Date() };
  }
  if (seller) filter.seller = new mongoose.Types.ObjectId(seller as string);
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (search) filter.$text = { $search: search as string };

  const allowedSorts: Record<string, string> = {
    '-createdAt': '-createdAt',
    price: 'basePrice',
    '-price': '-basePrice',
    rating: '-ratings.average',
    popular: '-analytics.salesCount',
    views: '-analytics.views',
  };
  const sortQuery = allowedSorts[sort as string] || '-createdAt';

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit))
      .populate('category', 'name slug')
      .populate('seller', 'name avatar')
      .select('-description -seo -shipping'),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

// ─── GET /products/:slug ──────────────────────────────────
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug, isPublished: true })
    .populate('category', 'name slug')
    .populate('seller', 'name avatar phone')
    .populate({
      path: 'reviews',
      select: 'rating title body user createdAt',
      options: { limit: 5, sort: '-createdAt' },
    });

  if (!product) throw new AppError('Product not found', 404);

  // Increment views asynchronously
  Product.findByIdAndUpdate(product._id, { $inc: { 'analytics.views': 1 } }).exec();

  res.json({ success: true, data: { product } });
});

// ─── POST /products (seller/admin) ───────────────────────
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;

  // Generate unique slug
  let slug = slugify(data.name);
  const existing = await Product.findOne({ slug });
  if (existing) slug = `${slug}-${Date.now()}`;

  const product = await Product.create({
    ...data,
    slug,
    seller: req.user!.id,
    isPublished: req.user!.role === 'admin' ? data.isPublished : false,
  });

  res.status(201).json({ success: true, data: { product } });
});

// ─── PATCH /products/:id (seller/admin) ──────────────────
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  // Only seller or admin can update
  if (req.user!.role !== 'admin' && product.seller.toString() !== req.user!.id) {
    throw new AppError('Unauthorized', 403);
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Emit real-time stock update if stock changed
  if (req.body.stock !== undefined) {
    emitInventoryUpdate(req.params.id, req.body.stock);
  }

  res.json({ success: true, data: { product: updated } });
});

// ─── DELETE /products/:id (seller/admin) ─────────────────
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  if (req.user!.role !== 'admin' && product.seller.toString() !== req.user!.id) {
    throw new AppError('Unauthorized', 403);
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

// ─── GET /products/:id/related ───────────────────────────
export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id).select('category tags brand');
  if (!product) throw new AppError('Product not found', 404);

  const related = await Product.find({
    _id: { $ne: product._id },
    isPublished: true,
    $or: [
      { category: product.category },
      { tags: { $in: product.tags } },
      { brand: product.brand },
    ],
  })
    .limit(8)
    .select('name slug images basePrice compareAtPrice ratings brand')
    .populate('category', 'name slug');

  res.json({ success: true, data: { products: related } });
});

// ─── GET /products/flash-sales ───────────────────────────
export const getFlashSales = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({
    isPublished: true,
    isFlashSale: true,
    flashSaleEndsAt: { $gt: new Date() },
    stock: { $gt: 0 },
  })
    .sort('-analytics.salesCount')
    .limit(12)
    .select('name slug images basePrice flashSalePrice flashSaleEndsAt ratings stock');

  res.json({ success: true, data: { products } });
});
