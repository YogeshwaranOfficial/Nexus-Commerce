// components/ui/NotificationBell.tsx
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Package, CreditCard, Tag, Star, AlertCircle, X, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationApi } from '../../services/api';
import { useAuthStore } from '../../stores';
import { Notification } from '../../types';
import { formatRelativeTime } from '../../utils';
import { useClickOutside } from '../../hooks';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  order: <Package size={14} />,
  payment: <CreditCard size={14} />,
  promo: <Tag size={14} />,
  review: <Star size={14} />,
  stock: <AlertCircle size={14} />,
  system: <Bell size={14} />,
};

const TYPE_COLORS: Record<string, string> = {
  order: 'bg-brand-100 dark:bg-brand-900/30 text-brand-500',
  payment: 'bg-green-100 dark:bg-green-900/30 text-green-500',
  promo: 'bg-amber-100 dark:bg-amber-900/30 text-amber-500',
  review: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500',
  stock: 'bg-red-100 dark:bg-red-900/30 text-red-500',
  system: 'bg-purple-100 dark:bg-purple-900/30 text-purple-500',
};

export function NotificationBell() {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll({ limit: 10 }).then((r) => r.data.data),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: Notification[] = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  if (!isAuthenticated) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost p-2 rounded-xl relative"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 card shadow-xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-surface-border-dark">
              <p className="font-semibold text-sm text-ink dark:text-ink-dark">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
                  <Bell size={24} className="mx-auto mb-2 opacity-40" />
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`flex gap-3 px-4 py-3 border-b border-surface-border/50 dark:border-surface-border-dark/50 last:border-0 transition-colors ${!n.isRead ? 'bg-brand-50/50 dark:bg-brand-950/20' : 'hover:bg-surface-card dark:hover:bg-surface-card-dark'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[n.type]}`}>
                      {TYPE_ICONS[n.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink dark:text-ink-dark">{n.title}</p>
                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark leading-relaxed line-clamp-2">{n.message}</p>
                      <p className="text-2xs text-ink-muted dark:text-ink-muted-dark mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markOneMutation.mutate(n._id)}
                        className="w-5 h-5 rounded-full bg-brand-500 shrink-0 mt-1 hover:bg-brand-600 transition-colors"
                        title="Mark as read"
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-surface-border dark:border-surface-border-dark">
              <Link
                to="/account/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-brand-500 font-semibold hover:text-brand-600 transition-colors"
              >
                View all notifications →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
