import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import { useUIStore } from '../../stores';

export default function MainLayout() {
  const { pathname } = useLocation();
  const closeMobileMenu = useUIStore((s) => s.closeMobileMenu);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    closeMobileMenu();
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0d0d12]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
