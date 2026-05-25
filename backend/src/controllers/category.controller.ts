import { Request, Response } from 'express';
import { Category } from '../models/index';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { slugify } from '../utils/slugify';

// ─── GET /categories ──────────────────────────────────────
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true, parent: { $exists: false } })
    .sort('sortOrder')
    .populate({ path: 'children', match: { isActive: true }, select: 'name slug image level sortOrder', options: { sort: { sortOrder: 1 } } });

  res.json({ success: true, data: { categories } });
});

// ─── GET /categories/:slug ────────────────────────────────
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate({ path: 'children', match: { isActive: true }, select: 'name slug image' });

  if (!category) throw new AppError('Category not found', 404);
  res.json({ success: true, data: { category } });
});

// ─── POST /categories (admin) ─────────────────────────────
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, parentId, image, sortOrder } = req.body;

  const slug = slugify(name);
  const existing = await Category.findOne({ slug });
  if (existing) throw new AppError('Category with this name already exists', 409);

  let level = 0;
  if (parentId) {
    const parent = await Category.findById(parentId);
    if (!parent) throw new AppError('Parent category not found', 404);
    level = parent.level + 1;
  }

  const category = await Category.create({
    name,
    slug,
    description,
    image,
    parent: parentId,
    level,
    sortOrder: sortOrder || 0,
  });

  res.status(201).json({ success: true, data: { category } });
});

// ─── PATCH /categories/:id (admin) ───────────────────────
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new AppError('Category not found', 404);
  res.json({ success: true, data: { category } });
});

// ─── DELETE /categories/:id (admin) ──────────────────────
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!category) throw new AppError('Category not found', 404);
  res.json({ success: true, message: 'Category deactivated' });
});
