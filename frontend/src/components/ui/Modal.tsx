import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useScrollLock } from '../../hooks';
import { cn } from '../../utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  showClose?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-5xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  showClose = true,
  className,
}: ModalProps) {
  useScrollLock(open);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'relative w-full bg-white dark:bg-[#13131a] rounded-2xl shadow-2xl border border-surface-border dark:border-surface-border-dark overflow-hidden',
              SIZE_MAP[size],
              className,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || showClose) && (
              <div className="flex items-start justify-between px-5 py-4 border-b border-surface-border dark:border-surface-border-dark">
                <div>
                  {title && <h2 className="font-bold text-base text-ink dark:text-ink-dark">{title}</h2>}
                  {description && <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-0.5">{description}</p>}
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:bg-surface-card dark:hover:bg-surface-card-dark hover:text-ink dark:hover:text-ink-dark transition-colors ml-3"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
            <div className="overflow-y-auto max-h-[80vh]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── ModalBody / ModalFooter helpers ─────────────────────
export function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 px-5 py-4 border-t border-surface-border dark:border-surface-border-dark', className)}>
      {children}
    </div>
  );
}
