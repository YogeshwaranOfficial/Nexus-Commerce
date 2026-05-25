import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingBag, Heart, Bell, User, Menu, X, Sun, Moon, Monitor,
  ChevronDown, Package, LogOut, Settings, LayoutDashboard, Store,
} from 'lucide-react';
import { useAuthStore, useCartStore, useUIStore, cartItemCount } from '../../stores';
import { searchApi } from '../../services/api';
import { useDebounce } from '../../hooks';
import { NotificationBell } from '../ui/NotificationBell';
import { CommandPalette, useCommandPalette } from '../ui/CommandPalette';

const NAV_LINKS = [
  { label: 'Products', to: '/products' },
  { label: 'Flash Sales', to: '/products?isFlashSale=true' },
  { label: 'New Arrivals', to: '/products?sort=-createdAt' },
  { label: 'Brands', to: '/products?view=brands' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, toggleCart } = useCartStore();
  const itemCount = cartItemCount(items);
  const { theme, setTheme, isMobileMenuOpen, toggleMobileMenu } = useUIStore();
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setSuggestions(null); return; }
    searchApi.suggestions(debouncedQuery)
      .then((r) => setSuggestions(r.data.data))
      .catch(() => setSuggestions(null));
  }, [debouncedQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  const handleLogout = async () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-[#0d0d12]/90 backdrop-blur-xl border-b border-surface-border dark:border-surface-border-dark shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">N</span>
            </div>
            <span className="font-black text-xl tracking-tight text-ink dark:text-ink-dark">
              NEXUS<span className="text-brand-500">.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-brand-500 bg-brand-50 dark:bg-brand-950/30'
                      : 'text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark hover:bg-surface-card dark:hover:bg-surface-card-dark'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <div ref={searchRef} className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="btn-ghost p-2 rounded-xl"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-[420px] card shadow-xl overflow-hidden"
                  >
                    <form onSubmit={handleSearch} className="flex items-center gap-2 p-3 border-b border-surface-border dark:border-surface-border-dark">
                      <Search size={16} className="text-ink-muted dark:text-ink-muted-dark shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search products, brands, categories..."
                        className="flex-1 bg-transparent outline-none text-sm text-ink dark:text-ink-dark placeholder:text-ink-muted dark:placeholder:text-ink-muted-dark"
                      />
                      {query && (
                        <button type="button" onClick={() => setQuery('')} className="text-ink-muted hover:text-ink dark:hover:text-ink-dark">
                          <X size={14} />
                        </button>
                      )}
                    </form>

                    {suggestions && (
                      <div className="p-2 max-h-80 overflow-y-auto">
                        {suggestions.products?.length > 0 && (
                          <>
                            <p className="px-3 py-1.5 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider">Products</p>
                            {suggestions.products.map((p: any) => (
                              <button
                                key={p._id}
                                onClick={() => { navigate(`/products/${p.slug}`); setSearchOpen(false); setQuery(''); }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-card dark:hover:bg-surface-card-dark text-left transition-colors"
                              >
                                <img src={p.images?.[0]?.url} alt={p.name} className="w-9 h-9 rounded-lg object-cover bg-surface-card dark:bg-surface-card-dark" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-ink dark:text-ink-dark truncate">{p.name}</p>
                                  <p className="text-xs text-ink-muted dark:text-ink-muted-dark">₹{p.basePrice?.toLocaleString('en-IN')}</p>
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                        {suggestions.categories?.length > 0 && (
                          <>
                            <p className="px-3 py-1.5 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mt-2">Categories</p>
                            {suggestions.categories.map((c: any) => (
                              <button
                                key={c._id}
                                onClick={() => { navigate(`/products?category=${c._id}`); setSearchOpen(false); setQuery(''); }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-card dark:hover:bg-surface-card-dark text-left text-sm text-ink dark:text-ink-dark transition-colors"
                              >
                                <Package size={14} className="text-ink-muted dark:text-ink-muted-dark" />
                                {c.name}
                              </button>
                            ))}
                          </>
                        )}
                        {!suggestions.products?.length && !suggestions.categories?.length && (
                          <p className="px-4 py-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">No results for "{query}"</p>
                        )}
                      </div>
                    )}

                    {!suggestions && (
                      <div className="p-4">
                        <p className="text-xs font-semibold text-ink-muted dark:text-ink-muted-dark mb-2">Popular Searches</p>
                        <div className="flex flex-wrap gap-2">
                          {['Smartphones', 'Laptops', 'Shoes', 'Headphones', 'Watches'].map((tag) => (
                            <button
                              key={tag}
                              onClick={() => { navigate(`/search?q=${tag}`); setSearchOpen(false); }}
                              className="px-3 py-1 rounded-full text-xs bg-surface-card dark:bg-surface-card-dark text-ink-secondary dark:text-ink-secondary-dark hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-500 transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist */}
            <Link to="/wishlist" className="btn-ghost p-2 rounded-xl hidden sm:flex" aria-label="Wishlist">
              <Heart size={20} />
            </Link>

            {/* Notifications */}
            <NotificationBell />

            {/* Cart */}
            <button onClick={toggleCart} className="btn-ghost p-2 rounded-xl relative" aria-label="Cart">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* Theme toggle */}
            <div className="hidden md:flex items-center gap-0.5 bg-surface-card dark:bg-surface-card-dark rounded-xl p-1 border border-surface-border dark:border-surface-border-dark">
              {themes.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  title={label}
                  className={`p-1.5 rounded-lg transition-colors ${
                    theme === value
                      ? 'bg-white dark:bg-[#0d0d12] text-brand-500 shadow-sm'
                      : 'text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark'
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <ChevronDown size={14} className="text-ink-muted dark:text-ink-muted-dark hidden sm:block" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-56 card shadow-xl overflow-hidden"
                      onBlur={() => setUserMenuOpen(false)}
                    >
                      <div className="p-3 border-b border-surface-border dark:border-surface-border-dark">
                        <p className="font-semibold text-sm text-ink dark:text-ink-dark truncate">{user?.name}</p>
                        <p className="text-xs text-ink-muted dark:text-ink-muted-dark truncate">{user?.email}</p>
                        <span className={`mt-1 badge ${
                          user?.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                          user?.role === 'seller' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                        }`}>
                          {user?.role}
                        </span>
                      </div>

                      <div className="p-1.5">
                        {[
                          { to: '/account/profile', icon: Settings, label: 'My Profile' },
                          { to: '/account/orders', icon: Package, label: 'My Orders' },
                          ...(user?.role === 'admin' ? [{ to: '/admin', icon: LayoutDashboard, label: 'Admin Panel' }] : []),
                          ...(user?.role === 'seller' || user?.role === 'admin' ? [{ to: '/seller', icon: Store, label: 'Seller Hub' }] : []),
                        ].map(({ to, icon: Icon, label }) => (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors"
                          >
                            <Icon size={15} />
                            {label}
                          </Link>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut size={15} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="btn-primary py-2 px-4 text-sm hidden sm:flex">
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button onClick={toggleMobileMenu} className="btn-ghost p-2 rounded-xl lg:hidden" aria-label="Menu">
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden border-t border-surface-border dark:border-surface-border-dark"
            >
              <div className="py-3 space-y-1">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={toggleMobileMenu}
                    className={({ isActive }) =>
                      `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-brand-500 bg-brand-50 dark:bg-brand-950/30'
                          : 'text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                {!isAuthenticated && (
                  <div className="pt-2 flex gap-2 px-1">
                    <Link to="/login" className="btn-secondary flex-1 text-sm py-2.5" onClick={toggleMobileMenu}>Sign In</Link>
                    <Link to="/register" className="btn-primary flex-1 text-sm py-2.5" onClick={toggleMobileMenu}>Sign Up</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </header>
  );
}
