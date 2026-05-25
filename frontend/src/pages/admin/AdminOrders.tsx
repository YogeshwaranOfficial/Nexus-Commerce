import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShoppingCart, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi, orderApi } from '../../services/api';
import { Order } from '../../types';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYMENT_STATUS_COLORS, getApiError } from '../../utils';
import { EmptyState, Skeleton } from '../../components/ui/index';
import { useUIStore } from '../../stores';
import { useDebounce } from '../../hooks';
import { useSEO } from '../../hooks/useSEO';

const NEXT_STATUS: Record<string, string | null> = {
  pending: 'confirmed',
  confirmed: 'processing',
  processing: 'shipped',
  shipped: 'out_for_delivery',
  out_for_delivery: 'delivered',
  delivered: null,
  cancelled: null,
};

export default function AdminOrders() {
  useSEO({ title: 'Order Management', noIndex: true });
  const qc = useQueryClient();
  const { showNotification } = useUIStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', debouncedSearch, status, paymentStatus, page],
    queryFn: () =>
      adminApi.getOrders({ search: debouncedSearch || undefined, status: status || undefined, paymentStatus: paymentStatus || undefined, page, limit: 20 })
        .then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      orderApi.updateStatus(id, newStatus, `Status updated to ${newStatus} by admin`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      showNotification('success', 'Order status updated');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const orders: Order[] = data?.orders ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-ink dark:text-ink-dark flex items-center gap-2">
          <ShoppingCart size={22} className="text-brand-500" /> Order Management
        </h1>
        {pagination && (
          <span className="badge bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
            {pagination.total.toLocaleString()} orders
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by order number…" className="input pl-9 py-2.5 text-sm" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input py-2.5 text-sm w-auto">
          <option value="">All Status</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="input py-2.5 text-sm w-auto">
          <option value="">All Payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState icon={<ShoppingCart size={28} />} title="No orders found" description="Try adjusting your filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border dark:border-surface-border-dark bg-surface-card dark:bg-surface-card-dark">
                    {['Order', 'Customer', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
                  {orders.map((order) => {
                    const user = order.user as any;
                    const nextStatus = NEXT_STATUS[order.status];
                    return (
                      <motion.tr key={order._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-ink dark:text-ink-dark">#{order.orderNumber}</p>
                          <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{order.items.length} items</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-ink dark:text-ink-dark">{user?.name || '—'}</p>
                          <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{user?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-ink dark:text-ink-dark">
                          {formatCurrency(order.pricing.total)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span className={`badge text-2xs block w-fit ${PAYMENT_STATUS_COLORS[order.payment.status]}`}>{order.payment.status}</span>
                            <span className="text-2xs text-ink-muted dark:text-ink-muted-dark capitalize">{order.payment.method}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge text-xs ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-muted dark:text-ink-muted-dark">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link to={`/account/orders/${order._id}`} target="_blank"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors">
                              <Eye size={14} />
                            </Link>
                            {nextStatus && (
                              <button
                                onClick={() => statusMutation.mutate({ id: order._id, newStatus: nextStatus })}
                                disabled={statusMutation.isPending}
                                className="px-2.5 py-1 rounded-lg text-2xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
                              >
                                → {ORDER_STATUS_LABELS[nextStatus]}
                              </button>
                            )}
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
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Page {page} of {pagination.pages}</p>
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
