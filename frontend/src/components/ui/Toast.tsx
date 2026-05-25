import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useUIStore } from '../../stores';

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const COLORS = {
  success: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300',
  error: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300',
  info: 'border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 text-brand-800 dark:text-brand-300',
};

const ICON_COLORS = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-brand-500',
};

export default function Toast() {
  const notification = useUIStore((s) => s.notification);
  const clearNotification = useUIStore((s) => s.clearNotification);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(clearNotification, 4000);
    return () => clearTimeout(t);
  }, [notification?.id]);

  if (!notification) return null;

  const Icon = ICONS[notification.type];

  return (
    <div className="fixed top-4 right-4 z-[100] pointer-events-none">
      <AnimatePresence>
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, x: 64, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 64, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl max-w-sm ${COLORS[notification.type]}`}
        >
          <Icon size={18} className={`shrink-0 mt-0.5 ${ICON_COLORS[notification.type]}`} />
          <p className="text-sm font-medium flex-1 leading-snug">{notification.message}</p>
          <button onClick={clearNotification} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5">
            <X size={15} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
