import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { createStripePaymentIntent, stripeWebhook, createRazorpayOrder, verifyRazorpayPayment } from '../controllers/payment.controller';

const router = Router();
// Stripe webhook needs raw body - registered before json middleware in app.ts
router.post('/webhook', stripeWebhook);
router.use(protect);
router.post('/stripe/intent', createStripePaymentIntent);
router.post('/razorpay/order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);

export default router;
