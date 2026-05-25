import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils';

// ─── Tabs ──────────────────────────────────────────────────
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills' | 'bordered';
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = 'underline', className }: TabsProps) {
  const baseItem = 'flex items-center gap-1.5 text-sm font-semibold transition-all cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed';

  if (variant === 'pills') {
    return (
      <div className={cn('flex gap-1 p-1 bg-surface-card dark:bg-surface-card-dark rounded-xl border border-surface-border dark:border-surface-border-dark', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              baseItem,
              'px-4 py-2 rounded-lg',
              activeTab === tab.id
                ? 'bg-white dark:bg-[#0d0d12] text-ink dark:text-ink-dark shadow-sm'
                : 'text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark',
            )}
          >
            {tab.icon}{tab.label}
            {tab.badge !== undefined && (
              <span className={cn('ml-0.5 px-1.5 py-0.5 rounded-full text-xs', activeTab === tab.id ? 'bg-brand-500 text-white' : 'bg-surface-border dark:bg-surface-border-dark text-ink-muted dark:text-ink-muted-dark')}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'bordered') {
    return (
      <div className={cn('flex gap-0 border border-surface-border dark:border-surface-border-dark rounded-xl overflow-hidden', className)}>
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              baseItem,
              'px-4 py-2.5',
              i > 0 && 'border-l border-surface-border dark:border-surface-border-dark',
              activeTab === tab.id
                ? 'bg-brand-500 text-white'
                : 'bg-transparent text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark',
            )}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>
    );
  }

  // underline (default)
  return (
    <div className={cn('flex gap-0 border-b border-surface-border dark:border-surface-border-dark', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onChange(tab.id)}
          className={cn(
            baseItem,
            'px-5 py-3 border-b-2 -mb-px',
            activeTab === tab.id
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark hover:border-surface-border dark:hover:border-surface-border-dark',
          )}
        >
          {tab.icon}{tab.label}
          {tab.badge !== undefined && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-surface-card dark:bg-surface-card-dark text-ink-muted dark:text-ink-muted-dark">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Tooltip ───────────────────────────────────────────────
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ content, children, side = 'top', delay = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = () => { timer.current = setTimeout(() => setVisible(true), delay); };
  const hide = () => { clearTimeout(timer.current); setVisible(false); };

  const positionClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side];

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-ink dark:bg-white dark:text-ink rounded-lg shadow-lg whitespace-nowrap pointer-events-none',
              positionClass,
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Breadcrumbs ───────────────────────────────────────────
interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-ink-muted dark:text-ink-muted-dark">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={12} className="opacity-50" />}
          {item.href && i < items.length - 1 ? (
            <Link to={item.href} className="hover:text-brand-500 transition-colors font-medium">{item.label}</Link>
          ) : (
            <span className={i === items.length - 1 ? 'text-ink dark:text-ink-dark font-semibold' : 'font-medium'}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ─── DropdownMenu ──────────────────────────────────────────
interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'danger';
  divider?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactElement;
  items: DropdownItem[];
  align?: 'left' | 'right';
  width?: string;
}

export function DropdownMenu({ trigger, items, align = 'right', width = 'w-48' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {React.cloneElement(trigger)}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              'absolute top-full mt-1.5 z-50 bg-white dark:bg-[#13131a] border border-surface-border dark:border-surface-border-dark rounded-xl shadow-xl overflow-hidden py-1',
              width,
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {items.map((item, i) => (
              <React.Fragment key={i}>
                {item.divider && <hr className="my-1 border-surface-border dark:border-surface-border-dark" />}
                {item.href ? (
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                      item.variant === 'danger'
                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark hover:text-ink dark:hover:text-ink-dark',
                    )}
                  >
                    {item.icon}{item.label}
                  </Link>
                ) : (
                  <button
                    disabled={item.disabled}
                    onClick={() => { item.onClick?.(); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                      item.variant === 'danger'
                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark hover:text-ink dark:hover:text-ink-dark',
                    )}
                  >
                    {item.icon}{item.label}
                  </button>
                )}
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
