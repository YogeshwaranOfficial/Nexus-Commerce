import { Request, Response } from 'express';
import { Cart, Coupon } from '../models/index';
import Product from '../models/Product.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── GET /cart ────────────────────────────────────────────
export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await Cart.findOne({ user: req.user!.id })
    .populate({
      path: 'items.product',
      select: 'name slug images basePrice flashSalePrice isFlashSale flashSaleEndsAt stock isPublished',
    });

  if (!cart) {
    return res.json({ success: true, data: { cart: { items: [], couponCode: null, couponDiscount: 0 } } });
  }

  // Filter out unpublished products
  const validItems = cart.items.filter((item) => {
    const product = item.product as any;
    return product && product.isPublished;
  });

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  res.json({ success: true, data: { cart } });
});

// ─── POST /cart ───────────────────────────────────────────
export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, variantId, quantity = 1 } = req.body;

  const product = await Product.findOne({ _id: productId, isPublished: true });
  if (!product) throw new AppError('Product not found or unavailable', 404);

  // Resolve price (variant or base)
  let price = product.basePrice;
  let itemName = product.name;
  let itemImage = product.images[0]?.url || '';
  let itemSku = product.sku;
  let maxStock = product.stock;

  if (variantId) {
    const variant = product.variants.find((v) => v.sku === variantId || v._id?.toString() === variantId);
    if (!variant) throw new AppError('Variant not found', 404);
    price = variant.price;
    itemName = `${product.name} — ${variant.name}`;
    itemSku = variant.sku;
    maxStock = variant.stock;
    if (variant.images.length > 0) itemImage = variant.images[0].url;
  }

  // Flash sale price
  if (product.isFlashSale && product.flashSalePrice && product.flashSaleEndsAt && product.flashSaleEndsAt > new Date()) {
    price = product.flashSalePrice;
  }

  if (maxStock < quantity) throw new AppError(`Only ${maxStock} items in stock`, 400);

  let cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) {
    cart = await Cart.create({ user: req.user!.id, items: [] });
  }

  const existingIdx = cart.items.findIndex(
    (i) => i.product.toString() === productId && (i.variantId || '') === (variantId || ''),
  );

  if (existingIdx > -1) {
    const newQty = cart.items[existingIdx].quantity + quantity;
    if (newQty > maxStock) throw new AppError(`Only ${maxStock} items in stock`, 400);
    cart.items[existingIdx].quantity = newQty;
    cart.items[existingIdx].price = price; // update price in case of flash sale change
  } else {
    cart.items.push({
      product: product._id,
      variantId,
      quantity,
      price,
      name: itemName,
      image: itemImage,
      sku: itemSku,
      attributes: variantId
        ? (product.variants.find((v) => v.sku === variantId || v._id?.toString() === variantId)?.attributes as any)
        : undefined,
    });
  }

  await cart.save();
  await cart.populate({ path: 'items.product', select: 'name slug images basePrice stock isPublished' });

  res.json({ success: true, data: { cart } });
});

// ─── PATCH /cart/:itemId ──────────────────────────────────
export const updateCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { quantity } = req.body;
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) throw new AppError('Cart not found', 404);

  const item = cart.items.id(itemId);
  if (!item) throw new AppError('Item not found in cart', 404);

  if (quantity <= 0) {
    cart.items.pull(itemId);
  } else {
    // Validate stock
    const product = await Product.findById(item.product).select('stock variants');
    if (product) {
      let maxStock = product.stock;
      if (item.variantId) {
        const variant = product.variants.find((v) => v.sku === item.variantId || v._id?.toString() === item.variantId);
        if (variant) maxStock = variant.stock;
      }
      if (quantity > maxStock) throw new AppError(`Only ${maxStock} items in stock`, 400);
    }
    item.quantity = quantity;
  }

  await cart.save();
  res.json({ success: true, data: { cart } });
});

// ─── DELETE /cart/:itemId ─────────────────────────────────
export const removeCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) throw new AppError('Cart not found', 404);

  cart.items.pull(req.params.itemId);
  await cart.save();

  res.json({ success: true, data: { cart } });
});

// ─── DELETE /cart ─────────────────────────────────────────
export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Cart.findOneAndUpdate(
    { user: req.user!.id },
    { items: [], couponCode: undefined, couponDiscount: 0 },
  );
  res.json({ success: true, message: 'Cart cleared' });
});

// ─── POST /cart/coupon ────────────────────────────────────
export const applyCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code } = req.body;

  const cart = await Cart.findOne({ user: req.user!.id });
  if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400);

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (!coupon) throw new AppError('Invalid or expired coupon code', 400);
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit has been reached', 400);
  }
  if (coupon.usedBy.some((id) => id.toString() === req.user!.id)) {
    throw new AppError('You have already used this coupon', 400);
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (subtotal < coupon.minOrderValue) {
    throw new AppError(`Minimum order value for this coupon is ₹${coupon.minOrderValue}`, 400);
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = Math.round(Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity));
  } else if (coupon.type === 'fixed') {
    discount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === 'free_shipping') {
    discount = 0; // handled at checkout
  }

  cart.couponCode = coupon.code;
  cart.couponDiscount = discount;
  await cart.save();

  res.json({
    success: true,
    data: {
      couponCode: coupon.code,
      discount,
      type: coupon.type,
      description: coupon.description,
    },
  });
});

// ─── DELETE /cart/coupon ──────────────────────────────────
export const removeCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Cart.findOneAndUpdate(
    { user: req.user!.id },
    { couponCode: undefined, couponDiscount: 0 },
  );
  res.json({ success: true, message: 'Coupon removed' });
});
