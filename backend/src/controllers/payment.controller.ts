import { Request, Response } from 'express';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });

// ─── Create Stripe Payment Intent ────────────────────────
export const createStripePaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user!.id });
  if (!order) throw new AppError('Order not found', 404);
  if (order.payment.status === 'paid') throw new AppError('Order already paid', 400);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.pricing.total * 100), // in paise
    currency: 'inr',
    metadata: {
      orderId: order._id.toString(),
      userId: req.user!.id,
      orderNumber: order.orderNumber,
    },
    automatic_payment_methods: { enabled: true },
  });

  await Order.findByIdAndUpdate(orderId, {
    'payment.gatewayOrderId': paymentIntent.id,
  });

  res.json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    },
  });
});

// ─── Stripe Webhook ───────────────────────────────────────
export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    throw new AppError('Webhook signature verification failed', 400);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await Order.findOneAndUpdate(
        { 'payment.gatewayOrderId': pi.id },
        {
          'payment.status': 'paid',
          'payment.transactionId': pi.id,
          'payment.paidAt': new Date(),
          status: 'confirmed',
          $push: { tracking: { status: 'confirmed', message: 'Payment received, order confirmed', timestamp: new Date() } },
        },
      );
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await Order.findOneAndUpdate(
        { 'payment.gatewayOrderId': pi.id },
        { 'payment.status': 'failed' },
      );
      break;
    }
  }

  res.json({ received: true });
});

// ─── Create Razorpay Order ────────────────────────────────
export const createRazorpayOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user!.id });
  if (!order) throw new AppError('Order not found', 404);
  if (order.payment.status === 'paid') throw new AppError('Order already paid', 400);

  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(order.pricing.total * 100),
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order._id.toString(), userId: req.user!.id },
  });

  await Order.findByIdAndUpdate(orderId, { 'payment.gatewayOrderId': rzpOrder.id });

  res.json({
    success: true,
    data: {
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// ─── Verify Razorpay Payment ──────────────────────────────
export const verifyRazorpayPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new AppError('Invalid payment signature', 400);
  }

  await Order.findOneAndUpdate(
    { _id: orderId, user: req.user!.id },
    {
      'payment.status': 'paid',
      'payment.transactionId': razorpay_payment_id,
      'payment.paidAt': new Date(),
      status: 'confirmed',
      $push: { tracking: { status: 'confirmed', message: 'Payment verified, order confirmed', timestamp: new Date() } },
    },
  );

  res.json({ success: true, message: 'Payment verified successfully' });
});
