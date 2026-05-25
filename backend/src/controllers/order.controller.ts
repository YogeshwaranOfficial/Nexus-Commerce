import { Request, Response } from 'express';
import Order from '../models/Order.model';
import { Cart, Coupon } from '../models/index';
import Product from '../models/Product.model';
import User from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { emitToUser, emitToAdmin, emitOrderUpdate } from '../config/socket';
import { EmailService } from '../services/email.service';

const TAX_RATE = 0.18; // 18% GST
const FREE_SHIPPING_THRESHOLD = 999; // ₹999
const SHIPPING_FEE = 99; // ₹99

// ─── GET /orders (user's orders) ─────────────────────────
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter: Record<string, unknown> = { user: req.user!.id };
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('-tracking'),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { orders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } },
  });
});

// ─── GET /orders/:id ──────────────────────────────────────
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).populate('items.product', 'name images slug');

  if (!order) throw new AppError('Order not found', 404);
  if (order.user.toString() !== req.user!.id && req.user!.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  res.json({ success: true, data: { order } });
});

// ─── POST /orders/checkout ────────────────────────────────
export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const { addressId, paymentMethod, couponCode, walletAmount = 0 } = req.body;

  // 1. Fetch cart
  const cart = await Cart.findOne({ user: req.user!.id }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400);

  // 2. Validate address
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError('User not found', 404);
  const address = user.addresses.find((a) => a._id?.toString() === addressId);
  if (!address) throw new AppError('Address not found', 400);

  // 3. Validate stock & build items
  let subtotal = 0;
  const orderItems = [];

  for (const cartItem of cart.items) {
    const product = cartItem.product as any;
    if (!product || !product.isPublished) throw new AppError(`Product no longer available: ${cartItem.name}`, 400);
    if (product.stock < cartItem.quantity) {
      throw new AppError(`Insufficient stock for ${cartItem.name}. Available: ${product.stock}`, 400);
    }

    const price = product.isFlashSale && product.flashSalePrice ? product.flashSalePrice : product.basePrice;
    const itemSubtotal = price * cartItem.quantity;
    subtotal += itemSubtotal;

    orderItems.push({
      product: product._id,
      seller: product.seller,
      variantId: cartItem.variantId,
      name: cartItem.name,
      image: cartItem.image,
      price,
      quantity: cartItem.quantity,
      subtotal: itemSubtotal,
      sku: cartItem.sku,
      attributes: cartItem.attributes,
    });
  }

  // 4. Apply coupon
  let couponDiscount = 0;
  let appliedCouponCode: string | undefined;
  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!coupon) throw new AppError('Invalid or expired coupon', 400);
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new AppError('Coupon usage limit reached', 400);
    if (coupon.usedBy.some((id) => id.toString() === req.user!.id)) throw new AppError('Coupon already used', 400);
    if (subtotal < coupon.minOrderValue) throw new AppError(`Minimum order value for this coupon is ₹${coupon.minOrderValue}`, 400);

    if (coupon.type === 'percentage') {
      couponDiscount = Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity);
    } else if (coupon.type === 'fixed') {
      couponDiscount = Math.min(coupon.value, subtotal);
    }
    appliedCouponCode = coupon.code;

    await Coupon.findByIdAndUpdate(coupon._id, {
      $inc: { usedCount: 1 },
      $push: { usedBy: req.user!.id },
    });
  }

  // 5. Calculate totals
  const discountedSubtotal = subtotal - couponDiscount;
  const shippingFee = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const taxableAmount = discountedSubtotal + shippingFee;
  const tax = Math.round(taxableAmount * TAX_RATE * 100) / 100;

  // Wallet
  const walletUsed = Math.min(walletAmount, user.walletBalance, taxableAmount + tax);
  const total = Math.max(0, taxableAmount + tax - walletUsed);

  // 6. Create order
  const order = await Order.create({
    user: req.user!.id,
    items: orderItems,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
    pricing: {
      subtotal,
      discount: 0,
      shippingFee,
      tax,
      total,
      walletUsed,
      couponCode: appliedCouponCode,
      couponDiscount,
    },
    payment: {
      method: paymentMethod,
      status: paymentMethod === 'cod' ? 'pending' : 'pending',
    },
    status: 'pending',
    tracking: [{ status: 'pending', message: 'Order placed successfully', timestamp: new Date() }],
  });

  // 7. Deduct stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, 'analytics.salesCount': item.quantity },
    });
  }

  // 8. Deduct wallet
  if (walletUsed > 0) {
    await User.findByIdAndUpdate(req.user!.id, { $inc: { walletBalance: -walletUsed } });
  }

  // 9. Clear cart
  await Cart.findByIdAndUpdate(cart._id, { items: [], couponCode: undefined, couponDiscount: 0 });

  // 10. Real-time + email notifications
  emitToUser(req.user!.id, 'order:created', { orderId: order._id, orderNumber: order.orderNumber });
  emitToAdmin('order:new', { orderId: order._id, orderNumber: order.orderNumber, total });
  await EmailService.sendOrderConfirmation(user.email, user.name, order);

  res.status(201).json({ success: true, data: { order } });
});

// ─── PATCH /orders/:id/status (admin/seller) ─────────────
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, message, location } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  const previousStatus = order.status;
  order.status = status;
  order.tracking.push({ status, message: message || `Order ${status}`, timestamp: new Date(), location });

  if (status === 'delivered') order.deliveredAt = new Date();
  if (status === 'cancelled') order.cancelledAt = new Date();

  await order.save();

  // Real-time update
  emitOrderUpdate(order._id.toString(), { status, tracking: order.tracking });
  emitToUser(order.user.toString(), 'order:updated', { orderId: order._id, status, orderNumber: order.orderNumber });

  res.json({ success: true, data: { order } });
});

// ─── POST /orders/:id/cancel ──────────────────────────────
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user!.id });
  if (!order) throw new AppError('Order not found', 404);

  const cancellableStatuses = ['pending', 'confirmed'];
  if (!cancellableStatuses.includes(order.status)) {
    throw new AppError(`Cannot cancel order in ${order.status} status`, 400);
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = req.body.reason || 'Customer requested cancellation';
  order.tracking.push({
    status: 'cancelled',
    message: 'Order cancelled by customer',
    timestamp: new Date(),
  });

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }

  // Refund wallet used
  if (order.pricing.walletUsed > 0) {
    await User.findByIdAndUpdate(order.user, { $inc: { walletBalance: order.pricing.walletUsed } });
  }

  await order.save();
  res.json({ success: true, data: { order } });
});
