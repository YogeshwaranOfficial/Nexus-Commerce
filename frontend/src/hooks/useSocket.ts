import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, useUIStore } from '../stores';
import { useQueryClient } from '@tanstack/react-query';

let socket: Socket | null = null;

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { showNotification } = useUIStore();
  const qc = useQueryClient();
  const connected = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect();
        socket = null;
        connected.current = false;
      }
      return;
    }

    if (connected.current) return;

    socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || '', {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      connected.current = true;
    });

    socket.on('disconnect', () => {
      connected.current = false;
    });

    // Order updates
    socket.on('order:updated', (data: { orderId: string; status: string; orderNumber: string }) => {
      qc.invalidateQueries({ queryKey: ['order', data.orderId] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      showNotification('info', `Order #${data.orderNumber} is now ${data.status}`);
    });

    socket.on('order:created', (data: { orderId: string; orderNumber: string }) => {
      qc.invalidateQueries({ queryKey: ['my-orders'] });
    });

    // Notifications
    socket.on('notification:new', (notification: any) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      showNotification('info', notification.title);
    });

    // Inventory
    socket.on('inventory:updated', (data: { productId: string; stock: number }) => {
      qc.invalidateQueries({ queryKey: ['product'] });
    });

    // Admin real-time
    socket.on('order:new', (data: any) => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    });

    return () => {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
        connected.current = false;
      }
    };
  }, [isAuthenticated, accessToken]);

  const trackOrder = useCallback((orderId: string) => {
    socket?.emit('track:order', orderId);
  }, []);

  const joinSellerRoom = useCallback((sellerId: string) => {
    socket?.emit('join:seller', sellerId);
  }, []);

  return { socket, trackOrder, joinSellerRoom };
}
