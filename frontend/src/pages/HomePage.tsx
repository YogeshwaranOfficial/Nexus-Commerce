import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Truck, RefreshCcw, ChevronRight } from 'lucide-react';
import { productApi, searchApi } from '../services/api';
import { Product } from '../types';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/index';
import { formatCurrency } from '../utils';
import { useCountdown } from '../hooks';
import { useSEO } from '../hooks/useSEO';

// ─── Hero Section ─────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0d0d12] via-[#13131a] to-[#0d0d12] min-h-[88vh] flex items-center">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                Flash Sale ends in 24 hours
              </div>
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-6">
                Shop the
                <span className="block bg-gradient-to-r from-brand-400 via-accent-400 to-brand-300 bg-clip-text text-transparent">
                  Future.
                </span>
              </h1>
              <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-md">
                Discover premium products from verified sellers. Powered by the latest tech for the seamless shopping experience you deserve.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/products" className="btn-primary text-base px-8 py-3.5">
                  Explore Now <ArrowRight size={18} />
                </Link>
                <Link to="/products?isFlashSale=true" className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors text-base">
                  <Zap size={18} className="text-amber-400" /> Flash Sales
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-10">
                {[{ v: '50K+', l: 'Products' }, { v: '2M+', l: 'Happy Customers' }, { v: '98%', l: 'Satisfaction' }].map(({ v, l }) => (
                  <div key={l}>
                    <p className="text-2xl font-black text-white">{v}</p>
                    <p className="text-white/50 text-sm">{l}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { emoji: '💻', name: 'MacBook Pro M3', price: 199999, cat: 'Laptops', discount: 15 },
              { emoji: '📱', name: 'iPhone 15 Pro', price: 134999, cat: 'Phones', discount: 8 },
              { emoji: '🎧', name: 'AirPods Pro 2', price: 24900, cat: 'Audio', discount: 20 },
              { emoji: '⌚', name: 'Apple Watch Ultra', price: 89900, cat: 'Wearables', discount: 12 },
            ].map((item, i) => (
              <motion.div key={item.name} animate={{ y: [0, i % 2 === 0 ? -8 : 8, 0] }} transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }} className="p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
                <div className="text-4xl mb-3">{item.emoji}</div>
                <span className="text-2xs font-semibold text-brand-400 uppercase tracking-wider">{item.cat}</span>
                <p className="text-white text-sm font-semibold mt-0.5 mb-2">{item.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">{formatCurrency(item.price)}</span>
                  <span className="badge bg-green-500/20 text-green-400 text-2xs border border-green-500/30">-{item.discount}%</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    { icon: Truck, title: 'Free Delivery', desc: 'On orders above ₹999' },
    { icon: Shield, title: 'Secure Payment', desc: '100% protected transactions' },
    { icon: RefreshCcw, title: 'Easy Returns', desc: '30-day hassle-free returns' },
    { icon: Zap, title: 'Fast Shipping', desc: '2-3 day delivery' },
  ];
  return (
    <section className="border-y border-surface-border dark:border-surface-border-dark bg-surface-card dark:bg-surface-card-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-surface-border dark:divide-surface-border-dark">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 py-5 px-6 first:pl-0 last:pr-0">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink dark:text-ink-dark">{title}</p>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FlashSaleSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['flash-sales'],
    queryFn: () => productApi.getFlashSales().then((r) => r.data.data.products as Product[]),
  });

  const flashEnd = data?.[0]?.flashSaleEndsAt ?? null;
  const timeLeft = useCountdown(flashEnd);

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap size={22} className="text-red-500 fill-red-500" />
            <h2 className="text-2xl font-black text-ink dark:text-ink-dark">Flash Sales</h2>
          </div>
          {flashEnd && (
            <div className="flex items-center gap-1">
              {[
                { v: String(timeLeft.hours).padStart(2, '0'), l: 'HR' },
                { v: String(timeLeft.minutes).padStart(2, '0'), l: 'MIN' },
                { v: String(timeLeft.seconds).padStart(2, '0'), l: 'SEC' },
              ].map(({ v, l }, i) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="bg-ink dark:bg-ink-dark text-white dark:text-[#0d0d12] text-sm font-black w-10 h-10 rounded-lg flex items-center justify-center font-mono">{v}</div>
                  {i < 2 && <span className="text-ink-muted dark:text-ink-muted-dark font-bold">:</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <Link to="/products?isFlashSale=true" className="flex items-center gap-1 text-sm text-brand-500 font-semibold hover:gap-2 transition-all">
          See All <ChevronRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : data?.slice(0, 6).map((product) => <ProductCard key={product._id} product={product} />)}
      </div>
    </section>
  );
}

function CategoryGrid() {
  const categories = [
    { name: 'Electronics', emoji: '💻', slug: 'electronics', color: 'from-blue-500/20 to-cyan-500/20 border-blue-200 dark:border-blue-800' },
    { name: 'Fashion', emoji: '👗', slug: 'fashion', color: 'from-pink-500/20 to-rose-500/20 border-pink-200 dark:border-pink-800' },
    { name: 'Home & Living', emoji: '🏠', slug: 'home-living', color: 'from-amber-500/20 to-orange-500/20 border-amber-200 dark:border-amber-800' },
    { name: 'Sports', emoji: '⚽', slug: 'sports', color: 'from-green-500/20 to-emerald-500/20 border-green-200 dark:border-green-800' },
    { name: 'Books', emoji: '📚', slug: 'books', color: 'from-purple-500/20 to-violet-500/20 border-purple-200 dark:border-purple-800' },
    { name: 'Beauty', emoji: '💄', slug: 'beauty', color: 'from-red-500/20 to-pink-500/20 border-red-200 dark:border-red-800' },
    { name: 'Toys', emoji: '🎮', slug: 'toys', color: 'from-indigo-500/20 to-blue-500/20 border-indigo-200 dark:border-indigo-800' },
    { name: 'Groceries', emoji: '🛒', slug: 'groceries', color: 'from-teal-500/20 to-green-500/20 border-teal-200 dark:border-teal-800' },
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-ink dark:text-ink-dark">Browse Categories</h2>
        <Link to="/products" className="flex items-center gap-1 text-sm text-brand-500 font-semibold hover:gap-2 transition-all">
          All Categories <ChevronRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.map((cat, i) => (
          <motion.div key={cat.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={`/products?category=${cat.slug}`} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border bg-gradient-to-br ${cat.color} hover:scale-105 transition-transform duration-200`}>
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs font-semibold text-ink dark:text-ink-dark text-center leading-tight">{cat.name}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FeaturedProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productApi.getAll({ isFeatured: true, limit: 8 }).then((r) => r.data.data.products as Product[]),
  });
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-ink dark:text-ink-dark">Featured Products</h2>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-0.5">Handpicked by our team</p>
        </div>
        <Link to="/products?isFeatured=true" className="flex items-center gap-1 text-sm text-brand-500 font-semibold hover:gap-2 transition-all">
          View All <ChevronRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : data?.map((product) => <ProductCard key={product._id} product={product} />)}
      </div>
    </section>
  );
}

function TrendingSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['trending-products'],
    queryFn: () => searchApi.search('', { sort: 'popular', limit: 4 }).then((r) => r.data.data.products as Product[]),
    staleTime: 5 * 60 * 1000,
  });
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-accent-600 p-8 flex flex-col justify-between min-h-64">
          <div className="absolute inset-0 mesh-bg opacity-30" />
          <div className="relative z-10">
            <span className="badge bg-white/20 text-white border border-white/30 text-xs mb-4">🔥 Trending</span>
            <h3 className="text-2xl font-black text-white leading-tight mb-2">Up to 50% off on Electronics</h3>
            <p className="text-white/70 text-sm mb-6">Limited time offer on top brands</p>
          </div>
          <Link to="/products?category=electronics" className="relative z-10 inline-flex items-center gap-2 bg-white text-brand-600 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors self-start">
            Shop Now <ArrowRight size={15} />
          </Link>
        </div>
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : data?.slice(0, 4).map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  useSEO({ title: 'Premium Shopping Experience', description: 'Discover thousands of premium products from verified sellers. Fast delivery, secure payments, easy returns.' });
  return (
    <div>
      <HeroSection />
      <TrustBar />
      <FlashSaleSection />
      <CategoryGrid />
      <FeaturedProducts />
      <TrendingSection />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d0d12] to-brand-950 border border-brand-800/30 p-10 text-center">
          <div className="absolute inset-0 mesh-bg opacity-20" />
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="text-3xl font-black text-white mb-2">Stay in the loop</h2>
            <p className="text-white/60 mb-6">Get exclusive deals, new arrivals, and style tips delivered to your inbox.</p>
            <form className="flex gap-2 max-w-sm mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm outline-none focus:border-brand-400 transition-colors" />
              <button type="submit" className="btn-primary shrink-0 py-3">Subscribe</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
