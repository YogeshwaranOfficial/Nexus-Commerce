import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
import { searchApi } from '../services/api';
import { Product } from '../types';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton, EmptyState } from '../components/ui/index';
import { useDebounce } from '../hooks';
import { useSEO } from '../hooks/useSEO';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'relevance';
  const page = Number(searchParams.get('page') || 1);

  useSEO({ title: q ? `Search: ${q}` : 'Search Products' });

  const debouncedQ = useDebounce(q, 200);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQ, sort, page],
    queryFn: () =>
      searchApi.search(debouncedQ, { sort, page, limit: 20 }).then((r) => r.data.data),
    enabled: debouncedQ.length >= 1,
    placeholderData: (prev) => prev,
  });

  const products: Product[] = data?.products ?? [];
  const pagination = data?.pagination;
  const facets = data?.facets;

  const update = (key: string, val: string | number) => {
    const p = new URLSearchParams(searchParams);
    p.set(key, String(val));
    if (key !== 'page') p.set('page', '1');
    setSearchParams(p);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Search size={20} className="text-brand-500" />
          <h1 className="text-2xl font-black text-ink dark:text-ink-dark">
            {q ? <>Results for "<span className="text-brand-500">{q}</span>"</> : 'Search Products'}
          </h1>
        </div>
        {pagination && q && (
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-1 ml-9">
            {pagination.total.toLocaleString()} products found
          </p>
        )}
      </div>

      {q ? (
        <div className="flex gap-6">
          {/* Facets sidebar */}
          {facets && (
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="card p-4 sticky top-24 space-y-5">
                <h3 className="font-semibold text-sm text-ink dark:text-ink-dark flex items-center gap-2">
                  <SlidersHorizontal size={15} /> Refine
                </h3>

                {/* Price range */}
                {facets.priceRange?.[0] && (
                  <div>
                    <p className="text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-2">Price</p>
                    <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                      ₹{facets.priceRange[0].min?.toLocaleString('en-IN')} – ₹{facets.priceRange[0].max?.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}

                {/* Brands */}
                {facets.brands?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-2">Brands</p>
                    <div className="space-y-1.5">
                      {facets.brands.slice(0, 8).map((b: any) => (
                        <label key={b._id} className="flex items-center gap-2 cursor-pointer text-sm text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark">
                          <input type="checkbox" className="accent-brand-500 rounded" />
                          <span className="flex-1 truncate">{b._id}</span>
                          <span className="text-xs text-ink-muted dark:text-ink-muted-dark">({b.count})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ratings */}
                {facets.ratings?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-2">Rating</p>
                    <div className="space-y-1.5">
                      {facets.ratings.map((r: any) => (
                        <label key={r._id} className="flex items-center gap-2 cursor-pointer text-sm text-ink-secondary dark:text-ink-secondary-dark">
                          <input type="radio" name="rating" className="accent-brand-500" />
                          <span>{r._id}★ & above</span>
                          <span className="text-xs text-ink-muted dark:text-ink-muted-dark ml-auto">({r.count})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex gap-1 flex-wrap">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => update('sort', o.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      sort === o.value
                        ? 'bg-brand-500 text-white'
                        : 'bg-surface-card dark:bg-surface-card-dark text-ink-secondary dark:text-ink-secondary-dark border border-surface-border dark:border-surface-border-dark hover:border-brand-300'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={<Search size={28} />}
                title={`No results for "${q}"`}
                description="Try different keywords, check your spelling, or remove filters."
              />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {products.map((product) => <ProductCard key={product._id} product={product} />)}
                </div>
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => update('page', p)}
                        className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                          p === page
                            ? 'bg-brand-500 text-white'
                            : 'bg-surface-card dark:bg-surface-card-dark text-ink-secondary dark:text-ink-secondary-dark border border-surface-border dark:border-surface-border-dark hover:border-brand-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Search size={32} />}
          title="What are you looking for?"
          description="Search for products, brands, categories and more."
        />
      )}
    </div>
  );
}
