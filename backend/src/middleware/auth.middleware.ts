import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { asyncHandler } from './asyncHandler';
import User, { UserRole } from '../models/User.model';


// ─── Protect: verify JWT ──────────────────────────────────
export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) throw new AppError('Authentication required', 401);

  const decoded = verifyAccessToken(token);
  req.user = { id: decoded.id, role: decoded.role as UserRole, email: decoded.email };

  next();
});

// ─── Require roles ────────────────────────────────────────
export const requireRoles = (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError('Authentication required', 401);
    if (!roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  };

// ─── Optional auth (for guest-accessible endpoints) ───────
export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = { id: decoded.id, role: decoded.role as UserRole, email: decoded.email };
    } catch {
      // Silently ignore invalid token for optional auth
    }
  }

  next();
});
