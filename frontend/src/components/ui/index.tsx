import { cn } from '../../utils';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Skeleton ─────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'skeleton animate-pulse bg-surface-card dark:bg-surface-card-dark',
        className,
      )}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-3 w-1/3 rounded-full" />
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="h-3.5 w-1/2 rounded-full" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-1/4 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-48 rounded-full" />
      <div className="flex gap-3">
        <Skeleton className="w-16 h-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4 rounded-full" />
          <Skeleton className="h-3 w-1/2 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark flex items-center justify-center mb-4 text-ink-muted dark:text-ink-muted-dark">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink dark:text-ink-dark mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark max-w-xs leading-relaxed mb-4">
          {description}
        </p>
      )}
      {action}
    </motion.div>
  );
}

// ─── StarRating ───────────────────────────────────────────
interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
  showCount?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({ rating, count, size = 14, showCount = true, interactive, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            onClick={() => interactive && onChange?.(star)}
            className={cn(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-surface-border dark:text-surface-border-dark',
            )}
          />
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-ink-muted dark:text-ink-muted-dark">({count.toLocaleString()})</span>
      )}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

const BADGE_VARIANTS = {
  default: 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400',
  success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  outline: 'border border-surface-border dark:border-surface-border-dark text-ink-secondary dark:text-ink-secondary-dark',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
        BADGE_VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={cn('animate-spin text-brand-500', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── Divider ──────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-surface-border dark:border-surface-border-dark my-6" />;
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 border-t border-surface-border dark:border-surface-border-dark" />
      <span className="text-xs text-ink-muted dark:text-ink-muted-dark font-medium">{label}</span>
      <div className="flex-1 border-t border-surface-border dark:border-surface-border-dark" />
    </div>
  );
}
