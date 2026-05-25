import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Visual panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-30" />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white font-black">N</span>
            </div>
            <span className="font-black text-xl text-white tracking-tight">NEXUS<span className="text-white/60">.</span></span>
          </Link>
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Your premium<br />shopping universe
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Discover thousands of products from verified sellers. Secure payments, fast delivery, and world-class customer support.
            </p>
          </motion.div>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: '50K+', label: 'Products' },
              { value: '10K+', label: 'Sellers' },
              { value: '2M+', label: 'Customers' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-white/60 text-sm mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/40 text-sm">
          © {new Date().getFullYear()} Nexus Commerce
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white dark:bg-[#0d0d12]">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">N</span>
            </div>
            <span className="font-black text-xl tracking-tight text-ink dark:text-ink-dark">
              NEXUS<span className="text-brand-500">.</span>
            </span>
          </Link>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
