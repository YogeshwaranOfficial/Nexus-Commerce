import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { totp } from 'otplib';
import User from '../models/User.model';
import { generateTokenPair, verifyRefreshToken, setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { EmailService } from '../services/email.service';
import { emitToUser } from '../config/socket';

// ─── Register ────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already in use', 409);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await User.create({
    name,
    email,
    password,
    otp: {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      purpose: 'email-verify',
    },
  });

  await EmailService.sendOTP(email, name, otp, 'email-verify');

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    data: { userId: user._id, email },
  });
});

// ─── Verify Email OTP ────────────────────────────────────
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new AppError('User not found', 404);
  if (user.isEmailVerified) throw new AppError('Email already verified', 400);
  if (!user.otp || user.otp.purpose !== 'email-verify') throw new AppError('Invalid OTP request', 400);
  if (user.otp.code !== otp) throw new AppError('Invalid OTP', 400);
  if (new Date() > user.otp.expiresAt) throw new AppError('OTP expired', 400);

  user.isEmailVerified = true;
  user.otp = undefined;
  await user.save();

  const tokens = generateTokenPair({ id: user._id.toString(), role: user.role, email: user.email });
  setRefreshTokenCookie(res, tokens.refreshToken);

  await EmailService.sendWelcome(email, user.name);

  res.json({
    success: true,
    message: 'Email verified successfully',
    data: { user: user.toSafeJSON(), accessToken: tokens.accessToken },
  });
});

// ─── Login ────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !user.password) throw new AppError('Invalid credentials', 401);
  if (!user.isActive) throw new AppError('Account suspended. Contact support.', 403);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid credentials', 401);

  if (!user.isEmailVerified) {
    // Resend OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), purpose: 'email-verify' };
    await user.save();
    await EmailService.sendOTP(email, user.name, otp, 'email-verify');

    throw new AppError('Email not verified. A new OTP has been sent.', 403);
  }

  const tokens = generateTokenPair({ id: user._id.toString(), role: user.role, email: user.email });

  // Store refresh token (keep max 5)
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), tokens.refreshToken];
  user.lastLogin = new Date();
  await user.save();

  setRefreshTokenCookie(res, tokens.refreshToken);

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: user.toSafeJSON(), accessToken: tokens.accessToken },
  });
});

// ─── Refresh Token ────────────────────────────────────────
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new AppError('Refresh token required', 401);

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !(user.refreshTokens || []).includes(token)) {
    throw new AppError('Invalid refresh token', 401);
  }

  const tokens = generateTokenPair({ id: user._id.toString(), role: user.role, email: user.email });

  // Rotate refresh token
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  user.refreshTokens.push(tokens.refreshToken);
  await user.save();

  setRefreshTokenCookie(res, tokens.refreshToken);

  res.json({ success: true, data: { accessToken: tokens.accessToken } });
});

// ─── Logout ───────────────────────────────────────────────
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const decoded = verifyRefreshToken(token).id;
    await User.findByIdAndUpdate(decoded, { $pull: { refreshTokens: token } });
  }
  clearRefreshTokenCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

// ─── Forgot Password ─────────────────────────────────────
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond 200 to prevent email enumeration
  if (!user) {
    return res.json({ success: true, message: 'If this email exists, you will receive a reset link.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await EmailService.sendPasswordReset(email, user.name, resetUrl);

  res.json({ success: true, message: 'If this email exists, you will receive a reset link.' });
});

// ─── Reset Password ───────────────────────────────────────
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+refreshTokens');

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // invalidate all sessions
  await user.save();

  clearRefreshTokenCookie(res);
  res.json({ success: true, message: 'Password reset successful. Please login.' });
});

// ─── OAuth Callback Handler ───────────────────────────────
export const oauthCallback = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as any;
  if (!user) throw new AppError('OAuth authentication failed', 401);

  const tokens = generateTokenPair({ id: user._id.toString(), role: user.role, email: user.email });

  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: tokens.refreshToken },
    lastLogin: new Date(),
  });

  setRefreshTokenCookie(res, tokens.refreshToken);

  // Redirect to frontend with access token
  res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${tokens.accessToken}`);
});

// ─── Get Me ───────────────────────────────────────────────
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user.id);
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});
