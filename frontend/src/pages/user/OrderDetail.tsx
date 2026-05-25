import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Package, MapPin, CreditCard, ChevronLeft, Download,
  CheckCircle2, Clock, Truck, Home, XCircle, AlertCircle,
} from 'lucide-react';
import { orderApi } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYMENT_STATUS_COLORS, getApiError } from '../../utils';
import { Skeleton, Badge } from '../../components/ui/index';
import { useUIStore } from '../../stores';
import { useSEO } from '../../hooks/useSEO';

const TRACKING_ICONS: Partial<Record<OrderStatus, React.ReactNode>> = {
  pending: <Clock size={16} />,
  confirmed: <CheckCircle2 size={16} />,
  processing: <Package size={16} />,
  shipped: <Truck size={16} />,
  out_for_delivery: <Truck size={16} />,
  delivered: <Home size={16} />,
  cancelled: <XCircle size={16} />,
  return_requested: <AlertCircle size={16} />,
};

const TRACKING_ORDER: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered',
];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showNotification } = useUIStore();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getById(id!).then((r) => r.data.data.order as Order),
    enabled: !!id,
  });

  useSEO({ title: order ? `Order #${order.orderNumber}` : 'Order Details', noIndex: true });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => orderApi.cancel(id!, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      showNotification('success', 'Order cancelled successfully');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40 rounded-xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!order) return null;

  const isCancellable = ['pending', 'confirmed'].includes(order.status);
  const currentStep = TRACKING_ORDER.indexOf(order.status);

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/account/orders')} className="flex items-center gap-1.5 text-sm text-ink-muted dark:text-ink-muted-dark hover:text-brand-500 transition-colors mb-5">
        <ChevronLeft size={16} /> Back to Orders
      </button>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-ink dark:text-ink-dark">Order #{order.orderNumber}</h1>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-0.5">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
          <span className={`badge ${PAYMENT_STATUS_COLORS[order.payment.status]}`}>Payment: {order.payment.status}</span>
          {isCancellable && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this order?')) {
                  cancelMutation.mutate('Customer requested cancellation');
                }
              }}
              className="badge bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Tracking Timeline */}
          {!['cancelled', 'return_requested', 'returned', 'refunded'].includes(order.status) && (
            <div className="card p-5">
              <h3 className="font-semibold text-ink dark:text-ink-dark mb-5 flex items-center gap-2">
                <Truck size={17} className="text-brand-500" /> Order Tracking
              </h3>
              <div className="relative">
                {/* Progress bar */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-surface-border dark:bg-surface-border-dark" />
                <div
                  className="absolute left-4 top-4 w-0.5 bg-brand-500 transition-all duration-500"
                  style={{ height: `${Math.max(0, (currentStep / (TRACKING_ORDER.length - 1)) * 100)}%` }}
                />

                <div className="space-y-6">
                  {TRACKING_ORDER.map((s, i) => {
                    const done = i <= currentStep;
                    const active = i === currentStep;
                    const event = order.tracking.find((t) => t.status === s);
                    return (
                      <motion.div
                        key={s}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-4 relative"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                          done ? 'bg-brand-500 text-white shadow-glow' :
                          'bg-surface-card dark:bg-surface-card-dark border-2 border-surface-border dark:border-surface-border-dark text-ink-muted dark:text-ink-muted-dark'
                        } ${active ? 'ring-4 ring-brand-200 dark:ring-brand-900/50' : ''}`}>
                          {TRACKING_ICONS[s] || <Package size={14} />}
                        </div>
                        <div className={`pt-1 ${done ? '' : 'opacity-40'}`}>
                          <p className={`text-sm font-semibold ${done ? 'text-ink dark:text-ink-dark' : 'text-ink-muted dark:text-ink-muted-dark'}`}>
                            {ORDER_STATUS_LABELS[s]}
                          </p>
                          {event ? (
                            <>
                              <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{event.message}</p>
                              <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{formatDate(event.timestamp, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            </>
                          ) : (
                            <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Waiting...</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="card p-4">
            <h3 className="font-semibold text-ink dark:text-ink-dark mb-4 flex items-center gap-2">
              <Package size={17} className="text-brand-500" /> Items ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3 pb-3 border-b border-surface-border dark:border-surface-border-dark last:border-0 last:pb-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-card dark:bg-surface-card-dark shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink dark:text-ink-dark line-clamp-1">{item.name}</p>
                    {item.attributes && Object.keys(item.attributes).length > 0 && (
                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                        {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Qty: {item.quantity} · SKU: {item.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-ink dark:text-ink-dark">{formatCurrency(item.subtotal)}</p>
                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{formatCurrency(item.price)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Pricing */}
          <div className="card p-4">
            <h3 className="font-semibold text-ink dark:text-ink-dark mb-3">Price Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-ink-secondary dark:text-ink-secondary-dark">
                <span>Subtotal</span><span>{formatCurrency(order.pricing.subtotal)}</span>
              </div>
              {order.pricing.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Coupon ({order.pricing.couponCode})</span>
                  <span>−{formatCurrency(order.pricing.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-secondary dark:text-ink-secondary-dark">
                <span>Shipping</span>
                <span>{order.pricing.shippingFee === 0 ? <span className="text-green-600 dark:text-green-400">FREE</span> : formatCurrency(order.pricing.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-ink-secondary dark:text-ink-secondary-dark">
                <span>Tax (GST)</span><span>{formatCurrency(order.pricing.tax)}</span>
              </div>
              {order.pricing.walletUsed > 0 && (
                <div className="flex justify-between text-purple-600 dark:text-purple-400">
                  <span>Wallet Used</span><span>−{formatCurrency(order.pricing.walletUsed)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-surface-border dark:border-surface-border-dark pt-2">
                <span className="text-ink dark:text-ink-dark">Total</span>
                <span className="text-brand-500">{formatCurrency(order.pricing.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card p-4">
            <h3 className="font-semibold text-ink dark:text-ink-dark mb-3 flex items-center gap-2">
              <CreditCard size={15} className="text-brand-500" /> Payment
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted dark:text-ink-muted-dark">Method</span>
                <span className="font-medium text-ink dark:text-ink-dark capitalize">{order.payment.method === 'cod' ? 'Cash on Delivery' : order.payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted dark:text-ink-muted-dark">Status</span>
                <span className={`badge text-xs ${PAYMENT_STATUS_COLORS[order.payment.status]}`}>{order.payment.status}</span>
              </div>
              {order.payment.transactionId && (
                <div className="flex justify-between">
                  <span className="text-ink-muted dark:text-ink-muted-dark">Txn ID</span>
                  <span className="font-mono text-xs text-ink-secondary dark:text-ink-secondary-dark truncate max-w-24">{order.payment.transactionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card p-4">
            <h3 className="font-semibold text-ink dark:text-ink-dark mb-3 flex items-center gap-2">
              <MapPin size={15} className="text-brand-500" /> Delivery Address
            </h3>
            <div className="text-sm space-y-0.5">
              <p className="font-medium text-ink dark:text-ink-dark">{order.shippingAddress.fullName}</p>
              <p className="text-ink-secondary dark:text-ink-secondary-dark">{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p className="text-ink-secondary dark:text-ink-secondary-dark">{order.shippingAddress.line2}</p>}
              <p className="text-ink-secondary dark:text-ink-secondary-dark">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p className="text-ink-muted dark:text-ink-muted-dark">📞 {order.shippingAddress.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
