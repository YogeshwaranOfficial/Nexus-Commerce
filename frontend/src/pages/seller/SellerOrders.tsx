import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { sellerApi, orderApi } from '../../services/api';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, getApiError } from '../../utils';
import { EmptyState, Skeleton } from '../../components/ui/index';
import { useUIStore } from '../../stores';
import { useDebounce } from '../../hooks';
import { useSEO } from '../../hooks/useSEO';

const STATUS_OPTIONS = ['', 'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export default function SellerOrders() {
  useSEO({ title: 'Seller Orders', noIndex: true });
  const qc = useQueryClient();
  const { showNotification } = useUIStore();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['seller-orders', status, page],
    queryFn: () => sellerApi.getOrders({ status: status || undefined, page, limit: 15 }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      orderApi.updateStatus(id, newStatus, `Order ${newStatus} by seller`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-orders'] });
      showNotification('success', 'Order status updated');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const orders: any[] = data?.orders ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-ink dark:text-ink-dark">Orders</h1>

      {/* Status filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
              status === s
                ? 'bg-brand-500 text-white'
                : 'bg-surface-card dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark text-ink-secondary dark:text-ink-secondary-dark'
            }`}
          >
            {s === '' ? 'All' : ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon={<ShoppingCart size={28} />} title="No orders found" description="Orders will appear here when customers purchase your products." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border dark:border-surface-border-dark">
                    {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Action'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-ink dark:text-ink-dark">#{order.orderNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                            {order.user?.avatar ? <img src={order.user.avatar} className="w-full h-full object-cover" /> : order.user?.name?.[0]}
                          </div>
                          <span className="text-sm text-ink dark:text-ink-dark">{order.user?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-secondary dark:text-ink-secondary-dark">
                        {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-ink dark:text-ink-dark">
                          {formatCurrency(order.items?.reduce((s: number, i: any) => s + i.subtotal, 0) || 0)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted dark:text-ink-muted-dark">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order._id, newStatus: 'processing' })}
                            className="text-xs text-brand-500 font-semibold hover:underline"
                          >
                            Mark Processing
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order._id, newStatus: 'shipped' })}
                            className="text-xs text-brand-500 font-semibold hover:underline"
                          >
                            Mark Shipped
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order._id, newStatus: 'delivered' })}
                            className="text-xs text-green-600 dark:text-green-400 font-semibold hover:underline"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {!['confirmed', 'processing', 'shipped'].includes(order.status) && (
                          <span className="text-xs text-ink-muted dark:text-ink-muted-dark">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border dark:border-surface-border-dark">
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{pagination.total} total orders</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-surface-border dark:border-surface-border-dark flex items-center justify-center disabled:opacity-40 hover:bg-surface-card dark:hover:bg-surface-card-dark">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="w-8 h-8 rounded-lg border border-surface-border dark:border-surface-border-dark flex items-center justify-center disabled:opacity-40 hover:bg-surface-card dark:hover:bg-surface-card-dark">
                    <ChevronRight size={14} />
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
