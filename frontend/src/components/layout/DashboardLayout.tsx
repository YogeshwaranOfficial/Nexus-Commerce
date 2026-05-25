import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import {
  User, Package, MapPin, Heart, LayoutDashboard, ShoppingCart,
  Users, BarChart2, Settings, Store, Tag, Star,
} from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

interface Props {
  isAdmin?: boolean;
  isSeller?: boolean;
}

const USER_NAV = [
  { to: '/account/profile', icon: User, label: 'Profile' },
  { to: '/account/orders', icon: Package, label: 'Orders' },
  { to: '/account/addresses', icon: MapPin, label: 'Addresses' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
];

const ADMIN_NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/products', icon: Tag, label: 'Products' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { to: '/admin/categories', icon: Settings, label: 'Categories' },
];

const SELLER_NAV = [
  { to: '/seller', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/seller/products', icon: Tag, label: 'Products' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Orders' },
];

export default function DashboardLayout({ isAdmin, isSeller }: Props) {
  const user = useAuthStore((s) => s.user);
  const navItems = isAdmin ? ADMIN_NAV : isSeller ? SELLER_NAV : USER_NAV;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0d0d12]">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 shrink-0 hidden md:block">
            <div className="card p-4 sticky top-24">
              {/* User info */}
              <div className="flex items-center gap-3 p-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center shrink-0 overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-ink dark:text-ink-dark truncate">{user?.name}</p>
                  <span className={`badge text-2xs ${
                    isAdmin ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                    isSeller ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                    'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                  }`}>
                    {isAdmin ? 'Admin' : isSeller ? 'Seller' : 'Customer'}
                  </span>
                </div>
              </div>

              <nav className="space-y-0.5">
                {navItems.map(({ to, icon: Icon, label, exact }: any) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={exact}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                          : 'text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark hover:text-ink dark:hover:text-ink-dark'
                      }`
                    }
                  >
                    <Icon size={17} />
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
