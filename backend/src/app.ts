import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import passport from 'passport';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logger } from './config/logger';
import './config/passport';

// ─── Route imports ────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import reviewRoutes from './routes/review.routes';
import couponRoutes from './routes/coupon.routes';
import wishlistRoutes from './routes/wishlist.routes';
import adminRoutes from './routes/admin.routes';
import sellerRoutes from './routes/seller.routes';
import searchRoutes from './routes/search.routes';
import uploadRoutes from './routes/upload.routes';
import notificationRoutes from './routes/notification.routes';

const app: Application = express();

// ─── Security middleware ──────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  'http://localhost:5173',
  'https://nexus-commerce-2026.vercel.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Nexus Commerce API is running successfully',
  });
});

app.head('/', (_req, res) => {
  res.sendStatus(200);
});

// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

app.use(mongoSanitize());

// ─── Body parsing ─────────────────────────────────────────
// Raw body needed for Stripe webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ─── Logging ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
  }));
}

// ─── Passport (OAuth) ─────────────────────────────────────
app.use(passport.initialize());

// ─── Health check ─────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────
const API = '/api';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/categories`, categoryRoutes);
app.use(`${API}/cart`, cartRoutes);
app.use(`${API}/orders`, orderRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/reviews`, reviewRoutes);
app.use(`${API}/coupons`, couponRoutes);
app.use(`${API}/wishlist`, wishlistRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/seller`, sellerRoutes);
app.use(`${API}/search`, searchRoutes);
app.use(`${API}/upload`, uploadRoutes);
app.use(`${API}/notifications`, notificationRoutes);

// ─── Error handling ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
