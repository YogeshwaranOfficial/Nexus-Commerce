import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Search } from 'lucide-react';
import { orderApi } from '../../services/api';
import { Order } from '../../types';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '../../utils';
import { EmptyState, OrderCardSkeleton, Badge } from '../../components/ui/index';
import { useSEO } from '../../hooks/useSEO';

const STATUS_TABS = [
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  useSEO({ title: 'My Orders', noIndex: true });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', status, page],
    queryFn: () => orderApi.getAll({ status: status || undefined, page, limit: 10 }).then((r) => r.data.data),
  });

  const orders: Order[] = data?.orders ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <h1 className="text-2xl font-black text-ink dark:text-ink-dark mb-6">My Orders</h1>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1); }}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              status === tab.value
                ? 'bg-brand-500 text-white'
                : 'bg-surface-card dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark text-ink-secondary dark:text-ink-secondary-dark hover:border-brand-300 dark:hover:border-brand-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <OrderCardSkeleton key={i} />)
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Package size={32} />}
            title="No orders found"
            description={status ? `You have no ${ORDER_STATUS_LABELS[status]?.toLowerCase()} orders.` : "You haven't placed any orders yet."}
            action={<Link to="/products" className="btn-primary text-sm py-2.5">Start Shopping</Link>}
          />
        ) : (
          orders.map((order, i) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-4 hover:shadow-card-hover dark:hover:shadow-card-hover-dark transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-ink-muted dark:text-ink-muted-dark mb-0.5">Order Number</p>
                  <p className="font-bold text-ink dark:text-ink-dark">#{order.orderNumber}</p>
                  <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`badge text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className={`badge text-2xs ${PAYMENT_STATUS_COLORS[order.payment.status]}`}>
                    Payment: {order.payment.status}
                  </span>
                </div>
              </div>

              {/* Items preview */}
              <div className="flex gap-2 mb-3">
                {order.items.slice(0, 4).map((item, j) => (
                  <div key={j} className="w-12 h-12 rounded-xl overflow-hidden bg-surface-card dark:bg-surface-card-dark shrink-0 relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    {order.items.length > 4 && j === 3 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">+{order.items.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex-1 min-w-0 flex flex-col justify-center pl-1">
                  <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm font-bold text-brand-500">{formatCurrency(order.pricing.total)}</p>
                  <p className="text-xs text-ink-muted dark:text-ink-muted-dark capitalize">via {order.payment.method}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-surface-border dark:border-surface-border-dark pt-3">
                <div className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  {order.status === 'delivered' && order.deliveredAt && (
                    <span className="text-green-600 dark:text-green-400">Delivered on {formatDate(order.deliveredAt)}</span>
                  )}
                  {order.status === 'shipped' && (
                    <span className="text-brand-500">Estimated delivery in 2-3 days</span>
                  )}
                </div>
                <Link
                  to={`/account/orders/${order._id}`}
                  className="flex items-center gap-1 text-sm text-brand-500 font-semibold hover:gap-2 transition-all"
                >
                  View Details <ChevronRight size={15} />
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                p === page ? 'bg-brand-500 text-white' : 'bg-surface-card dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark text-ink-secondary dark:text-ink-secondary-dark hover:border-brand-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
