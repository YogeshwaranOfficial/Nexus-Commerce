import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Spinner } from './index';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const VARIANT_STYLES = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-500',
    confirmBtn: 'bg-red-500 hover:bg-red-600 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-500',
    confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  info: {
    icon: AlertTriangle,
    iconBg: 'bg-brand-100 dark:bg-brand-900/30',
    iconColor: 'text-brand-500',
    confirmBtn: 'bg-brand-500 hover:bg-brand-600 text-white',
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = styles.icon;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#13131a] rounded-2xl shadow-2xl border border-surface-border dark:border-surface-border-dark p-6"
          >
            <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors">
              <X size={15} />
            </button>

            <div className={`w-12 h-12 rounded-2xl ${styles.iconBg} flex items-center justify-center mb-4`}>
              <Icon size={22} className={styles.iconColor} />
            </div>

            <h3 className="font-bold text-base text-ink dark:text-ink-dark mb-1.5">{title}</h3>
            {description && (
              <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark leading-relaxed mb-5">{description}</p>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-surface-border dark:border-surface-border-dark text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${styles.confirmBtn}`}
              >
                {loading ? <Spinner size={16} className="text-white" /> : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── useConfirm hook for imperative usage ─────────────────
import { useState, useCallback } from 'react';

interface UseConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: ConfirmDialogProps['variant'];
}

export function useConfirm() {
  const [state, setState] = useState<{ open: boolean; options: UseConfirmOptions; resolve?: (v: boolean) => void }>({
    open: false,
    options: { title: '' },
  });

  const confirm = useCallback((options: UseConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleClose = useCallback(() => {
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false }));
  }, [state.resolve]);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false }));
  }, [state.resolve]);

  const Dialog = (
    <ConfirmDialog
      open={state.open}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={state.options.title}
      description={state.options.description}
      confirmLabel={state.options.confirmLabel}
      variant={state.options.variant}
    />
  );

  return { confirm, Dialog };
}
