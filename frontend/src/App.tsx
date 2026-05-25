import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUIStore, useAuthStore } from './stores';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import PageLoader from './components/ui/PageLoader';
import Toast from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useSocket } from './hooks/useSocket';

const HomePage        = lazy(() => import('./pages/HomePage'));
const ProductsPage    = lazy(() => import('./pages/product/ProductsPage'));
const ProductDetail   = lazy(() => import('./pages/product/ProductDetail'));
const SearchPage      = lazy(() => import('./pages/SearchPage'));
const CartPage        = lazy(() => import('./pages/CartPage'));
const CheckoutPage    = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccess    = lazy(() => import('./pages/OrderSuccess'));
const WishlistPage    = lazy(() => import('./pages/WishlistPage'));
const LoginPage       = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage    = lazy(() => import('./pages/auth/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ForgotPassword  = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPassword   = lazy(() => import('./pages/auth/ResetPasswordPage'));
const OAuthCallback   = lazy(() => import('./pages/auth/OAuthCallback'));
const ProfilePage     = lazy(() => import('./pages/user/ProfilePage'));
const OrdersPage      = lazy(() => import('./pages/user/OrdersPage'));
const OrderDetail     = lazy(() => import('./pages/user/OrderDetail'));
const AddressesPage   = lazy(() => import('./pages/user/AddressesPage'));
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders     = lazy(() => import('./pages/admin/AdminOrders'));
const AdminProducts   = lazy(() => import('./pages/admin/AdminProducts'));
const AdminUsers      = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAnalytics  = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminCoupons    = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const SellerDashboard = lazy(() => import('./pages/seller/SellerDashboard'));
const SellerProducts  = lazy(() => import('./pages/seller/SellerProducts'));
const SellerOrders    = lazy(() => import('./pages/seller/SellerOrders'));
const AddProduct      = lazy(() => import('./pages/seller/AddProduct'));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
function RequireRole({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}
function SocketInit() { useSocket(); return null; }

export default function App() {
  const theme = useUIStore((s) => s.theme);
  const notification = useUIStore((s) => s.notification);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'light') root.classList.remove('dark');
    else root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const h = (e: MediaQueryListEvent) => document.documentElement.classList.toggle('dark', e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [theme]);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <SocketInit />
        {notification && <Toast />}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:slug" element={<ProductDetail />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="cart" element={<CartPage />} />
            </Route>
            <Route element={<GuestOnly><AuthLayout /></GuestOnly>}>
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
            </Route>
            <Route path="oauth/callback" element={<OAuthCallback />} />
            <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="order-success/:id" element={<OrderSuccess />} />
            </Route>
            <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
              <Route path="account/profile" element={<ProfilePage />} />
              <Route path="account/orders" element={<OrdersPage />} />
              <Route path="account/orders/:id" element={<OrderDetail />} />
              <Route path="account/addresses" element={<AddressesPage />} />
            </Route>
            <Route element={<RequireAuth><RequireRole roles={['admin']}><DashboardLayout isAdmin /></RequireRole></RequireAuth>}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/orders" element={<AdminOrders />} />
              <Route path="admin/products" element={<AdminProducts />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/analytics" element={<AdminAnalytics />} />
              <Route path="admin/coupons" element={<AdminCoupons />} />
              <Route path="admin/categories" element={<AdminCategories />} />
            </Route>
            <Route element={<RequireAuth><RequireRole roles={['seller','admin']}><DashboardLayout isSeller /></RequireRole></RequireAuth>}>
              <Route path="seller" element={<SellerDashboard />} />
              <Route path="seller/products" element={<SellerProducts />} />
              <Route path="seller/products/add" element={<AddProduct />} />
              <Route path="seller/orders" element={<SellerOrders />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
