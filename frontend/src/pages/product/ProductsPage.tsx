import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, LayoutGrid, LayoutList } from 'lucide-react';
import { productApi } from '../../services/api';
import { Product, ProductFilters } from '../../types';
import ProductCard from '../../components/product/ProductCard';
import { ProductCardSkeleton, EmptyState, Spinner } from '../../components/ui/index';
import { formatCurrency } from '../../utils';
import { useSEO } from '../../hooks/useSEO';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

const RATING_OPTIONS = [4, 3, 2, 1];

// ─── Filter Sidebar ───────────────────────────────────────
function FilterSidebar({
  filters,
  onChange,
  onClear,
}: {
  filters: ProductFilters;
  onChange: (k: keyof ProductFilters, v: any) => void;
  onClear: () => void;
}) {
  const [priceRange, setPriceRange] = useState([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 100000,
  ]);

  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.rating || filters.inStock;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink dark:text-ink-dark">Filters</h3>
        {hasActiveFilters && (
          <button onClick={onClear} className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Price range */}
      <div>
        <h4 className="text-sm font-semibold text-ink dark:text-ink-dark mb-3">Price Range</h4>
        <div className="flex items-center gap-2 text-xs text-ink-secondary dark:text-ink-secondary-dark mb-3">
          <span>{formatCurrency(priceRange[0])}</span>
          <span className="flex-1 text-center">–</span>
          <span>{formatCurrency(priceRange[1])}</span>
        </div>
        <input
          type="range"
          min={0}
          max={200000}
          step={500}
          value={priceRange[1]}
          onChange={(e) => {
            const v = Number(e.target.value);
            setPriceRange([priceRange[0], v]);
            onChange('maxPrice', v);
          }}
          className="w-full accent-brand-500"
        />
        <div className="flex gap-2 mt-3">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice ?? ''}
            onChange={(e) => onChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
            className="input text-xs py-2 px-3"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ?? ''}
            onChange={(e) => onChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
            className="input text-xs py-2 px-3"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-sm font-semibold text-ink dark:text-ink-dark mb-3">Minimum Rating</h4>
        <div className="space-y-2">
          {RATING_OPTIONS.map((r) => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="rating"
                checked={filters.rating === r}
                onChange={() => onChange('rating', filters.rating === r ? undefined : r)}
                className="accent-brand-500"
              />
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-sm ${i < r ? 'text-amber-400' : 'text-surface-border dark:text-surface-border-dark'}`}>★</span>
                ))}
                <span className="text-xs text-ink-secondary dark:text-ink-secondary-dark ml-1">& above</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h4 className="text-sm font-semibold text-ink dark:text-ink-dark mb-3">Availability</h4>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStock === true}
            onChange={(e) => onChange('inStock', e.target.checked ? true : undefined)}
            className="accent-brand-500 w-4 h-4 rounded"
          />
          <span className="text-sm text-ink-secondary dark:text-ink-secondary-dark">In Stock Only</span>
        </label>
      </div>

      {/* Flash Sale */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isFlashSale === true}
            onChange={(e) => onChange('isFlashSale', e.target.checked ? true : undefined)}
            className="accent-brand-500 w-4 h-4 rounded"
          />
          <span className="text-sm text-ink-secondary dark:text-ink-secondary-dark">Flash Sale Only</span>
        </label>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function ProductsPage() {
  useSEO({ title: 'All Products', description: 'Browse thousands of premium products.' });
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const getFilters = (): ProductFilters => ({
    page: Number(searchParams.get('page') ?? 1),
    limit: 20,
    sort: searchParams.get('sort') ?? '-createdAt',
    category: searchParams.get('category') ?? undefined,
    brand: searchParams.get('brand') ?? undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    inStock: searchParams.get('inStock') === 'true' ? true : undefined,
    isFlashSale: searchParams.get('isFlashSale') === 'true' ? true : undefined,
    search: searchParams.get('q') ?? undefined,
  });

  const filters = getFilters();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.getAll(filters as any).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const updateFilter = (key: keyof ProductFilters, value: any) => {
    const params = new URLSearchParams(searchParams);
    if (value === undefined || value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (searchParams.get('sort')) params.set('sort', searchParams.get('sort')!);
    setSearchParams(params);
  };

  const products: Product[] = data?.products ?? [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink dark:text-ink-dark">
            {filters.isFlashSale ? '⚡ Flash Sales' : filters.search ? `Results for "${filters.search}"` : 'All Products'}
          </h1>
          {pagination && (
            <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-0.5">
              {pagination.total.toLocaleString()} products found
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="btn-secondary text-sm py-2 lg:hidden"
          >
            <SlidersHorizontal size={15} /> Filters
          </button>

          {/* Sort */}
          <div className="relative">
            <select
              value={filters.sort ?? '-createdAt'}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="input py-2 pl-3 pr-8 text-sm appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark pointer-events-none" />
          </div>

          {/* View toggle */}
          <div className="flex border border-surface-border dark:border-surface-border-dark rounded-xl overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`p-2.5 ${view === 'grid' ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-500' : 'text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2.5 ${view === 'list' ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-500' : 'text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark'}`}
            >
              <LayoutList size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar - desktop */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="card p-5 sticky top-24">
            <FilterSidebar filters={filters} onChange={updateFilter} onClear={clearFilters} />
          </div>
        </aside>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {filtersOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setFiltersOpen(false)}
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-[#0d0d12] z-50 p-5 overflow-y-auto shadow-2xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-ink dark:text-ink-dark">Filters</h3>
                  <button onClick={() => setFiltersOpen(false)} className="btn-ghost p-1.5 rounded-lg">
                    <X size={18} />
                  </button>
                </div>
                <FilterSidebar filters={filters} onChange={updateFilter} onClear={clearFilters} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search terms to find what you're looking for."
              action={
                <button onClick={clearFilters} className="btn-primary text-sm py-2.5 px-6">
                  Clear Filters
                </button>
              }
            />
          ) : (
            <>
              <div className={`grid gap-5 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => updateFilter('page', p)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                        p === filters.page
                          ? 'bg-brand-500 text-white'
                          : 'bg-surface-card dark:bg-surface-card-dark text-ink-secondary dark:text-ink-secondary-dark hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-500 border border-surface-border dark:border-surface-border-dark'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {isFetching && !isLoading && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
