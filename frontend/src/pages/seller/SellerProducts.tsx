import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus, Search, Package, Pencil, Trash2, Eye,
  ToggleLeft, ToggleRight, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { sellerApi, productApi } from '../../services/api';
import { Product } from '../../types';
import { formatCurrency, formatDate, getApiError } from '../../utils';
import { EmptyState, Skeleton, Badge, Spinner } from '../../components/ui/index';
import { useUIStore } from '../../stores';
import { useDebounce } from '../../hooks';
import { useSEO } from '../../hooks/useSEO';

export default function SellerProducts() {
  useSEO({ title: 'My Products', noIndex: true });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showNotification } = useUIStore();
  const [search, setSearch] = useState('');
  const [filterPublished, setFilterPublished] = useState<string>('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['seller-products', debouncedSearch, filterPublished, page],
    queryFn: () =>
      sellerApi.getProducts({
        search: debouncedSearch || undefined,
        isPublished: filterPublished !== '' ? filterPublished : undefined,
        page,
        limit: 15,
      }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-products'] });
      showNotification('success', 'Product deleted');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const products: Product[] = data?.products ?? [];
  const pagination = data?.pagination;

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-black text-ink dark:text-ink-dark">My Products</h1>
        <Link to="/seller/products/add" className="btn-primary text-sm py-2.5">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="input pl-9 py-2.5 text-sm"
          />
        </div>
        <select
          value={filterPublished}
          onChange={(e) => { setFilterPublished(e.target.value); setPage(1); }}
          className="input py-2.5 text-sm w-auto min-w-36"
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Drafts</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="No products found"
            description={search ? 'Try a different search term.' : 'Start by adding your first product.'}
            action={<Link to="/seller/products/add" className="btn-primary text-sm py-2.5"><Plus size={16} /> Add Product</Link>}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border dark:border-surface-border-dark">
                    {['Product', 'Price', 'Stock', 'Rating', 'Status', 'Added', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
                  {products.map((product) => (
                    <motion.tr
                      key={product._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-card dark:bg-surface-card-dark shrink-0">
                            <img src={product.images[0]?.url} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink dark:text-ink-dark line-clamp-1">{product.name}</p>
                            <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-ink dark:text-ink-dark">{formatCurrency(product.basePrice)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${
                          product.stock === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          product.stock <= 5 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        }`}>{product.stock} units</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-amber-400">★</span>
                          <span className="text-ink dark:text-ink-dark font-medium">{product.ratings.average.toFixed(1)}</span>
                          <span className="text-ink-muted dark:text-ink-muted-dark text-xs">({product.ratings.count})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${product.isPublished ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                          {product.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted dark:text-ink-muted-dark">
                        {formatDate(product.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/products/${product.slug}`}
                            target="_blank"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            to={`/seller/products/edit/${product._id}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden p-4 space-y-3">
              {products.map((product) => (
                <div key={product._id} className="flex gap-3 p-3 rounded-xl border border-surface-border dark:border-surface-border-dark">
                  <img src={product.images[0]?.url} alt={product.name} className="w-14 h-14 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink dark:text-ink-dark line-clamp-1">{product.name}</p>
                    <p className="text-sm font-bold text-brand-500">{formatCurrency(product.basePrice)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge text-2xs ${product.isPublished ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                        {product.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-2xs text-ink-muted dark:text-ink-muted-dark">Stock: {product.stock}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link to={`/seller/products/edit/${product._id}`} className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30">
                      <Pencil size={13} />
                    </Link>
                    <button onClick={() => handleDelete(product._id, product.name)} className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border dark:border-surface-border-dark">
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center border border-surface-border dark:border-surface-border-dark disabled:opacity-40 hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors">
                    <ChevronLeft size={15} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="w-8 h-8 rounded-lg flex items-center justify-center border border-surface-border dark:border-surface-border-dark disabled:opacity-40 hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
