// ─── OrderSuccess.tsx ─────────────────────────────────────
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { orderApi } from '../services/api';
import { Order } from '../types';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../utils';
import { Skeleton } from '../components/ui/index';
import { useSEO } from '../hooks/useSEO';

export default function OrderSuccess() {
  useSEO({ title: 'Order Confirmed', noIndex: true });
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getById(id!).then((r) => r.data.data.order as Order),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
        <Skeleton className="h-8 w-64 rounded-xl mx-auto" />
        <Skeleton className="h-4 w-48 rounded-full mx-auto" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle size={40} className="text-green-500 fill-green-100 dark:fill-green-900/30" />
        </motion.div>
        <h1 className="text-3xl font-black text-ink dark:text-ink-dark mb-2">Order Placed!</h1>
        <p className="text-ink-secondary dark:text-ink-secondary-dark">
          Your order <span className="font-semibold text-brand-500">#{order?.orderNumber}</span> has been placed successfully.
        </p>
        {order?.payment.method === 'cod' && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl inline-block">
            💰 Pay ₹{order?.pricing.total.toLocaleString('en-IN')} on delivery
          </p>
        )}
      </motion.div>

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Order meta */}
          <div className="card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Order ID', value: `#${order.orderNumber}` },
              { label: 'Date', value: formatDate(order.createdAt) },
              { label: 'Status', value: ORDER_STATUS_LABELS[order.status] },
              { label: 'Total', value: formatCurrency(order.pricing.total) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark mb-1">{label}</p>
                <p className="font-semibold text-sm text-ink dark:text-ink-dark">{value}</p>
              </div>
            ))}
          </div>

          {/* Items */}
          <div className="card p-4">
            <p className="font-semibold text-sm text-ink dark:text-ink-dark mb-3">Items Ordered</p>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-surface-card dark:bg-surface-card-dark" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink dark:text-ink-dark line-clamp-1">{item.name}</p>
                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink dark:text-ink-dark">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping address */}
          <div className="card p-4">
            <p className="font-semibold text-sm text-ink dark:text-ink-dark mb-2">Delivering to</p>
            <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">{order.shippingAddress.fullName}</p>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
              {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link to={`/account/orders/${order._id}`} className="btn-primary flex-1 justify-center py-3">
              <Package size={17} /> Track Order
            </Link>
            <Link to="/products" className="btn-secondary flex-1 justify-center py-3">
              <ShoppingBag size={17} /> Continue Shopping
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
