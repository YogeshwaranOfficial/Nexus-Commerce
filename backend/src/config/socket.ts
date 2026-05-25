import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from './logger';

let io: Server;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
}

export function initSocket(server: HTTPServer): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Auth middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = verifyAccessToken(token) as { id: string; role: string };
      socket.userId = decoded.id;
      socket.role = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Join personal room
    if (socket.userId) socket.join(`user:${socket.userId}`);

    // Admin room
    if (socket.role === 'admin') socket.join('admin');

    // Order tracking
    socket.on('track:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    // Seller room
    socket.on('join:seller', (sellerId: string) => {
      if (socket.userId === sellerId || socket.role === 'admin') {
        socket.join(`seller:${sellerId}`);
      }
    });

    // Live chat
    socket.on('chat:message', (data: { to: string; message: string; conversationId: string }) => {
      io.to(`user:${data.to}`).emit('chat:message', {
        from: socket.userId,
        message: data.message,
        conversationId: data.conversationId,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

// ─── Emit helpers ─────────────────────────────────────────
export const emitToUser = (userId: string, event: string, data: unknown) =>
  getIO().to(`user:${userId}`).emit(event, data);

export const emitToAdmin = (event: string, data: unknown) =>
  getIO().to('admin').emit(event, data);

export const emitOrderUpdate = (orderId: string, data: unknown) =>
  getIO().to(`order:${orderId}`).emit('order:updated', data);

export const emitInventoryUpdate = (productId: string, stock: number) =>
  getIO().emit('inventory:updated', { productId, stock });
