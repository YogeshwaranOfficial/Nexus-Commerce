import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, Search, ChevronLeft, ChevronRight, Eye, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi, productApi } from '../../services/api';
import { Product } from '../../types';
import { formatCurrency, formatDate, getApiError } from '../../utils';
import { EmptyState, Skeleton } from '../../components/ui/index';
import { useUIStore } from '../../stores';
import { useDebounce } from '../../hooks';
import { useSEO } from '../../hooks/useSEO';

export default function AdminProducts() {
  useSEO({ title: 'Product Moderation', noIndex: true });
  const qc = useQueryClient();
  const { showNotification } = useUIStore();
  const [search, setSearch] = useState('');
  const [isPublished, setIsPublished] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', debouncedSearch, isPublished, page],
    queryFn: () =>
      adminApi.getProducts({ search: debouncedSearch || undefined, isPublished: isPublished !== '' ? isPublished : undefined, page, limit: 20 })
        .then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.togglePublish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      showNotification('success', 'Product status updated');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      showNotification('success', 'Product deleted');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const products: Product[] = data?.products ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-ink dark:text-ink-dark flex items-center gap-2">
          <Package size={22} className="text-brand-500" /> Product Moderation
        </h1>
        {pagination && (
          <span className="badge bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
            {pagination.total.toLocaleString()} products
          </span>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search products…" className="input pl-9 py-2.5 text-sm" />
        </div>
        <select value={isPublished} onChange={(e) => { setIsPublished(e.target.value); setPage(1); }} className="input py-2.5 text-sm w-auto">
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Pending / Draft</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : products.length === 0 ? (
          <EmptyState icon={<Package size={28} />} title="No products found" description="Try different filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border dark:border-surface-border-dark bg-surface-card dark:bg-surface-card-dark">
                    {['Product', 'Seller', 'Price', 'Stock', 'Rating', 'Status', 'Added', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
                  {products.map((product) => {
                    const seller = product.seller as any;
                    return (
                      <motion.tr key={product._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-card dark:bg-surface-card-dark shrink-0">
                              <img src={product.images[0]?.url} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink dark:text-ink-dark line-clamp-1">{product.name}</p>
                              <p className="text-xs text-ink-muted dark:text-ink-muted-dark font-mono">{product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{seller?.name || '—'}</p>
                          <p className="text-2xs text-ink-muted dark:text-ink-muted-dark">{seller?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-ink dark:text-ink-dark">{formatCurrency(product.basePrice)}</td>
                        <td className="px-4 py-3">
                          <span className={`badge text-xs ${product.stock === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : product.stock <= 5 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-ink dark:text-ink-dark">
                          ⭐ {product.ratings.average.toFixed(1)} <span className="text-ink-muted dark:text-ink-muted-dark text-xs">({product.ratings.count})</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleMutation.mutate(product._id)}
                            disabled={toggleMutation.isPending}
                            className={`flex items-center gap-1.5 badge cursor-pointer transition-all ${product.isPublished ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200'}`}
                          >
                            {product.isPublished ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                            {product.isPublished ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-muted dark:text-ink-muted-dark">{formatDate(product.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link to={`/products/${product.slug}`} target="_blank"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors">
                              <Eye size={14} />
                            </Link>
                            <button
                              onClick={() => { if (window.confirm('Delete this product?')) deleteMutation.mutate(product._id); }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border dark:border-surface-border-dark">
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Page {page} of {pagination.pages} · {pagination.total} total</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-surface-border dark:border-surface-border-dark flex items-center justify-center disabled:opacity-40"><ChevronLeft size={14} /></button>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="w-8 h-8 rounded-lg border border-surface-border dark:border-surface-border-dark flex items-center justify-center disabled:opacity-40"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
