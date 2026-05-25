import { Request, Response } from 'express';
import Product from '../models/Product.model';
import { Category } from '../models/index';
import { asyncHandler } from '../middleware/asyncHandler';

// ─── GET /search ──────────────────────────────────────────
export const search = asyncHandler(async (req: Request, res: Response) => {
  const {
    q,
    page = 1,
    limit = 20,
    sort = 'relevance',
    category,
    brand,
    minPrice,
    maxPrice,
    rating,
    inStock,
    tags,
  } = req.query;

  if (!q || (q as string).trim().length === 0) {
    return res.json({ success: true, data: { products: [], total: 0, pagination: { page: 1, limit: Number(limit), total: 0, pages: 0 } } });
  }

  const query = (q as string).trim();

  // Build filter
  const filter: Record<string, unknown> = {
    isPublished: true,
    $text: { $search: query },
  };

  if (category) filter.category = category;
  if (brand) filter.brand = { $in: (brand as string).split(',') };
  if (rating) filter['ratings.average'] = { $gte: Number(rating) };
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (tags) filter.tags = { $in: (tags as string).split(',') };
  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) (filter.basePrice as any).$gte = Number(minPrice);
    if (maxPrice) (filter.basePrice as any).$lte = Number(maxPrice);
  }

  const sortMap: Record<string, Record<string, number | object>> = {
    relevance: { score: { $meta: 'textScore' } },
    price_asc: { basePrice: 1 },
    price_desc: { basePrice: -1 },
    rating: { 'ratings.average': -1 },
    newest: { createdAt: -1 },
    popular: { 'analytics.salesCount': -1 },
  };
  const sortQuery = sortMap[sort as string] || sortMap.relevance;

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter, { score: { $meta: 'textScore' } })
      .sort(sortQuery as any)
      .skip(skip)
      .limit(Number(limit))
      .populate('category', 'name slug')
      .select('name slug images basePrice compareAtPrice flashSalePrice isFlashSale ratings stock brand category'),
    Product.countDocuments(filter),
  ]);

  // Aggregated facets for filters
  const facets = await Product.aggregate([
    { $match: { isPublished: true, $text: { $search: query } } },
    {
      $facet: {
        brands: [{ $group: { _id: '$brand', count: { $sum: 1 } } }, { $match: { _id: { $ne: null } } }, { $sort: { count: -1 } }, { $limit: 20 }],
        priceRange: [{ $group: { _id: null, min: { $min: '$basePrice' }, max: { $max: '$basePrice' } } }],
        ratings: [{ $group: { _id: { $floor: '$ratings.average' }, count: { $sum: 1 } } }, { $sort: { _id: -1 } }],
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      products,
      query,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      facets: facets[0] || {},
    },
  });
});

// ─── GET /search/suggestions ──────────────────────────────
export const getSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || (q as string).length < 2) return res.json({ success: true, data: { suggestions: [] } });

  const query = (q as string).trim();
  const regex = new RegExp(query, 'i');

  const [products, categories] = await Promise.all([
    Product.find({ isPublished: true, name: regex })
      .limit(6)
      .select('name slug images basePrice brand')
      .lean(),
    Category.find({ isActive: true, name: regex })
      .limit(3)
      .select('name slug')
      .lean(),
  ]);

  // Also get tag suggestions
  const tagProducts = await Product.find({
    isPublished: true,
    tags: regex,
  })
    .limit(3)
    .distinct('tags');

  const matchingTags = tagProducts.filter((tag: string) => regex.test(tag)).slice(0, 5);

  res.json({
    success: true,
    data: {
      products: products.map((p) => ({ type: 'product', ...p })),
      categories: categories.map((c) => ({ type: 'category', ...c })),
      tags: matchingTags.map((tag) => ({ type: 'tag', name: tag })),
    },
  });
});

// ─── GET /search/trending ─────────────────────────────────
export const getTrending = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({ isPublished: true, stock: { $gt: 0 } })
    .sort({ 'analytics.views': -1, 'analytics.salesCount': -1 })
    .limit(10)
    .select('name slug images basePrice compareAtPrice ratings brand')
    .lean();

  res.json({ success: true, data: { products } });
});
