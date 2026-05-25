import { Response } from 'express';
import { Notification } from '../models/index';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { emitToUser } from '../config/socket';

// ─── GET /notifications ───────────────────────────────────
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const filter: Record<string, unknown> = { user: req.user!.id };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user!.id, isRead: false }),
  ]);

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    },
  });
});

// ─── PATCH /notifications/:id/read ───────────────────────
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!.id },
    { isRead: true },
  );
  res.json({ success: true });
});

// ─── PATCH /notifications/read-all ───────────────────────
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ user: req.user!.id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

// ─── DELETE /notifications/:id ────────────────────────────
export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
  res.json({ success: true });
});

// ─── Utility: create and push notification ────────────────
export async function createNotification(
  userId: string,
  type: 'order' | 'payment' | 'promo' | 'review' | 'stock' | 'system',
  title: string,
  message: string,
  link?: string,
  metadata?: Record<string, unknown>,
) {
  const notification = await Notification.create({ user: userId, type, title, message, link, metadata });
  emitToUser(userId, 'notification:new', notification);
  return notification;
}
