// ─── routes/auth.routes.ts ────────────────────────────────
import { Router } from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import { register, login, logout, verifyEmail, refreshToken, forgotPassword, resetPassword, oauthCallback, getMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

const authRouter = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Too many auth requests' } });

authRouter.post('/register', authLimiter, [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  validate,
], register);

authRouter.post('/verify-email', [body('email').isEmail(), body('otp').isLength({ min: 6, max: 6 }), validate], verifyEmail);
authRouter.post('/login', authLimiter, [body('email').isEmail(), body('password').notEmpty(), validate], login);
authRouter.post('/logout', logout);
authRouter.post('/refresh', refreshToken);
authRouter.post('/forgot-password', authLimiter, [body('email').isEmail(), validate], forgotPassword);
authRouter.post('/reset-password', [body('token').notEmpty(), body('password').isLength({ min: 8 }), validate], resetPassword);
authRouter.get('/me', protect, getMe);

authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
authRouter.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), oauthCallback);
authRouter.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
authRouter.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/login' }), oauthCallback);

export default authRouter;
