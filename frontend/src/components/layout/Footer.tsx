import { Link } from 'react-router-dom';
import { Github, Twitter, Instagram, Mail, MapPin, Phone } from 'lucide-react';

const LINKS = {
  Shop: [
    { label: 'All Products', to: '/products' },
    { label: 'Flash Sales', to: '/products?isFlashSale=true' },
    { label: 'New Arrivals', to: '/products?sort=-createdAt' },
    { label: 'Best Sellers', to: '/products?sort=popular' },
  ],
  Account: [
    { label: 'My Profile', to: '/account/profile' },
    { label: 'My Orders', to: '/account/orders' },
    { label: 'Wishlist', to: '/wishlist' },
    { label: 'Become a Seller', to: '/seller' },
  ],
  Support: [
    { label: 'Help Center', to: '#' },
    { label: 'Returns & Refunds', to: '#' },
    { label: 'Shipping Info', to: '#' },
    { label: 'Contact Us', to: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-surface-border dark:border-surface-border-dark bg-surface-card dark:bg-surface-card-dark mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-black text-sm">N</span>
              </div>
              <span className="font-black text-xl tracking-tight text-ink dark:text-ink-dark">
                NEXUS<span className="text-brand-500">.</span>
              </span>
            </Link>
            <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark leading-relaxed mb-4 max-w-xs">
              Premium shopping experience for the modern consumer. Discover thousands of curated products from verified sellers.
            </p>
            <div className="space-y-2 text-sm text-ink-muted dark:text-ink-muted-dark">
              <div className="flex items-center gap-2"><MapPin size={14} className="text-brand-500" /> Mumbai, Maharashtra, India</div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-brand-500" /> +91 98765 43210</div>
              <div className="flex items-center gap-2"><Mail size={14} className="text-brand-500" /> support@nexus.com</div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {[Twitter, Instagram, Github].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-xl bg-white dark:bg-[#0d0d12] border border-surface-border dark:border-surface-border-dark flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:text-brand-500 hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="font-semibold text-sm text-ink dark:text-ink-dark mb-3">{section}</h3>
              <ul className="space-y-2">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-ink-secondary dark:text-ink-secondary-dark hover:text-brand-500 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-surface-border dark:border-surface-border-dark flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
            © {new Date().getFullYear()} Nexus Commerce. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-ink-muted dark:text-ink-muted-dark">
            <Link to="#" className="hover:text-brand-500 transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-brand-500 transition-colors">Terms of Service</Link>
            <Link to="#" className="hover:text-brand-500 transition-colors">Cookie Policy</Link>
          </div>
          <div className="flex items-center gap-2">
            {['Visa', 'Mastercard', 'UPI', 'Razorpay'].map((method) => (
              <span key={method} className="px-2 py-0.5 rounded text-xs font-medium bg-white dark:bg-[#0d0d12] border border-surface-border dark:border-surface-border-dark text-ink-secondary dark:text-ink-secondary-dark">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
