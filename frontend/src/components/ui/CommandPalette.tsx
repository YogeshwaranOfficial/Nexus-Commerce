import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Users, ShoppingCart, Tag, Home, Settings, X, ArrowRight, Loader2 } from 'lucide-react';
import { searchApi } from '../../services/api';
import { useDebounce, useScrollLock } from '../../hooks';
import { cn } from '../../utils';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  group: string;
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const STATIC_COMMANDS: CommandItem[] = [
  { id: 'home', label: 'Go to Home', icon: <Home size={16} />, action: () => {}, group: 'Navigation', shortcut: 'G H' },
  { id: 'products', label: 'All Products', icon: <Package size={16} />, action: () => {}, group: 'Navigation' },
  { id: 'cart', label: 'View Cart', icon: <ShoppingCart size={16} />, action: () => {}, group: 'Navigation' },
  { id: 'orders', label: 'My Orders', icon: <ShoppingCart size={16} />, action: () => {}, group: 'Account' },
  { id: 'profile', label: 'Profile Settings', icon: <Settings size={16} />, action: () => {}, group: 'Account' },
  { id: 'admin-users', label: 'Manage Users', icon: <Users size={16} />, action: () => {}, group: 'Admin' },
  { id: 'admin-coupons', label: 'Manage Coupons', icon: <Tag size={16} />, action: () => {}, group: 'Admin' },
];

const ROUTES: Record<string, string> = {
  home: '/', products: '/products', cart: '/cart',
  orders: '/account/orders', profile: '/account/profile',
  'admin-users': '/admin/users', 'admin-coupons': '/admin/coupons',
};

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useScrollLock(open);

  // Auto focus
  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(''); setActiveIndex(0); }
  }, [open]);

  // Search products on query change
  useEffect(() => {
    if (debouncedQuery.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    searchApi.suggestions(debouncedQuery)
      .then((r) => setSearchResults(r.data.data.products?.slice(0, 5) || []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  const filteredStatic = query
    ? STATIC_COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : STATIC_COMMANDS;

  const allItems = [
    ...filteredStatic.map((c) => ({
      ...c,
      action: () => { navigate(ROUTES[c.id] || '/'); onClose(); },
    })),
    ...searchResults.map((p: any) => ({
      id: p._id,
      label: p.name,
      description: `₹${p.basePrice?.toLocaleString('en-IN')}`,
      icon: p.images?.[0]?.url
        ? <img src={p.images[0].url} alt="" className="w-4 h-4 rounded object-cover" />
        : <Package size={16} />,
      action: () => { navigate(`/products/${p.slug}`); onClose(); },
      group: 'Products',
    })),
  ];

  const groups = [...new Set(allItems.map((i) => i.group))];

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, allItems.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && allItems[activeIndex]) { allItems[activeIndex].action(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, allItems, activeIndex, onClose]);

  let itemIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -16 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#13131a] rounded-2xl shadow-2xl border border-surface-border dark:border-surface-border-dark overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border dark:border-surface-border-dark">
              {searching ? (
                <Loader2 size={18} className="text-brand-500 animate-spin shrink-0" />
              ) : (
                <Search size={18} className="text-ink-muted dark:text-ink-muted-dark shrink-0" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                placeholder="Search products, pages, commands…"
                className="flex-1 bg-transparent outline-none text-sm text-ink dark:text-ink-dark placeholder:text-ink-muted dark:placeholder:text-ink-muted-dark"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark">
                  <X size={15} />
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-2xs text-ink-muted dark:text-ink-muted-dark bg-surface-card dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark rounded-md">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {allItems.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
                  No results for "{query}"
                </p>
              ) : (
                groups.map((group) => {
                  const groupItems = allItems.filter((i) => i.group === group);
                  return (
                    <div key={group}>
                      <p className="px-4 py-1.5 text-2xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider">{group}</p>
                      {groupItems.map((item) => {
                        itemIndex++;
                        const idx = itemIndex;
                        return (
                          <button
                            key={item.id}
                            onClick={item.action}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                              activeIndex === idx
                                ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'
                                : 'text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark',
                            )}
                          >
                            <span className={cn('shrink-0', activeIndex === idx ? 'text-brand-500' : 'text-ink-muted dark:text-ink-muted-dark')}>
                              {item.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.label}</p>
                              {item.description && <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{item.description}</p>}
                            </div>
                            {item.shortcut && (
                              <span className="text-2xs text-ink-muted dark:text-ink-muted-dark shrink-0 hidden sm:block">{item.shortcut}</span>
                            )}
                            {activeIndex === idx && <ArrowRight size={13} className="shrink-0 text-brand-500" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-surface-border dark:border-surface-border-dark flex items-center gap-3 text-2xs text-ink-muted dark:text-ink-muted-dark">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-card dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark rounded text-2xs">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-card dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark rounded text-2xs">↵</kbd> Select</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-card dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark rounded text-2xs">Esc</kbd> Close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Global Cmd+K shortcut hook ───────────────────────────
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen };
}
