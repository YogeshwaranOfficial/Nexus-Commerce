import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag, Trash2, Plus, Minus, Tag, ArrowRight,
  ChevronRight, RefreshCcw, Truck, Shield, X
} from 'lucide-react';
import { useCartStore, useAuthStore, useUIStore, cartSubtotal, cartItemCount } from '../stores';
import { cartApi } from '../services/api';
import { formatCurrency, getApiError } from '../utils';
import { EmptyState, Spinner } from '../components/ui/index';
import { useSEO } from '../hooks/useSEO';

export default function CartPage() {
  useSEO({ title: 'My Cart', noIndex: true });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { showNotification } = useUIStore();
  const {
    items, removeItem, updateQuantity,
    couponCode, couponDiscount, applyCoupon, removeCoupon,
  } = useCartStore();
  const subtotal = cartSubtotal(items);
  const itemCount = cartItemCount(items);

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const shippingFee = subtotal >= 999 ? 0 : 99;
  const tax = Math.round((subtotal - couponDiscount) * 0.18);
  const total = subtotal - couponDiscount + shippingFee + tax;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const res = await cartApi.applyCoupon(couponInput.trim().toUpperCase());
      const { couponCode: code, discount } = res.data.data;
      applyCoupon(code, discount);
      showNotification('success', `Coupon applied! You saved ${formatCurrency(discount)}`);
      setCouponInput('');
    } catch (err) {
      showNotification('error', getApiError(err));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    showNotification('info', 'Coupon removed');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={<ShoppingBag size={32} />}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Explore our products and find something you love."
          action={
            <Link to="/products" className="btn-primary">
              Browse Products <ArrowRight size={16} />
            </Link>
          }
          className="min-h-[50vh]"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <ShoppingBag size={22} className="text-brand-500" />
        <h1 className="text-2xl font-black text-ink dark:text-ink-dark">
          My Cart <span className="text-ink-muted dark:text-ink-muted-dark font-normal text-lg">({itemCount} items)</span>
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={`${item.productId}:${item.variantId || ''}`}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
                className="card p-4 flex gap-4"
              >
                {/* Image */}
                <Link to={`/products/${item.productId}`} className="shrink-0">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-surface-card dark:bg-surface-card-dark">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/products/${item.productId}`}>
                        <h3 className="font-semibold text-sm text-ink dark:text-ink-dark hover:text-brand-500 transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>
                      {item.attributes && Object.keys(item.attributes).length > 0 && (
                        <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">
                          {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">SKU: {item.sku}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Qty control */}
                    <div className="flex items-center border border-surface-border dark:border-surface-border-dark rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                        className="w-9 h-9 flex items-center justify-center text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-ink dark:text-ink-dark">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                        disabled={item.quantity >= item.stock}
                        className="w-9 h-9 flex items-center justify-center text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-ink dark:text-ink-dark">{formatCurrency(item.price * item.quantity)}</p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{formatCurrency(item.price)} each</p>
                      )}
                    </div>
                  </div>

                  {item.stock <= 5 && (
                    <p className="text-xs text-red-500 font-medium mt-2">⚠ Only {item.stock} left in stock</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Continue shopping */}
          <Link to="/products" className="flex items-center gap-2 text-sm text-brand-500 font-semibold hover:gap-3 transition-all pt-2">
            <ChevronRight size={16} className="rotate-180" /> Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="card p-4">
            <h3 className="font-semibold text-sm text-ink dark:text-ink-dark mb-3 flex items-center gap-2">
              <Tag size={15} className="text-brand-500" /> Coupon Code
            </h3>
            {couponCode ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">{couponCode}</p>
                  <p className="text-xs text-green-600 dark:text-green-500">You saved {formatCurrency(couponDiscount)}</p>
                </div>
                <button onClick={handleRemoveCoupon} className="text-green-600 dark:text-green-400 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder="Enter coupon code"
                  className="input flex-1 py-2.5 text-sm"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput}
                  className="btn-secondary px-4 py-2.5 text-sm shrink-0 disabled:opacity-50"
                >
                  {couponLoading ? <Spinner size={15} /> : 'Apply'}
                </button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="card p-4">
            <h3 className="font-semibold text-ink dark:text-ink-dark mb-4">Order Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-secondary dark:text-ink-secondary-dark">Subtotal ({itemCount} items)</span>
                <span className="font-medium text-ink dark:text-ink-dark">{formatCurrency(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Coupon Discount</span>
                  <span>−{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-secondary dark:text-ink-secondary-dark">Shipping</span>
                {shippingFee === 0 ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">FREE</span>
                ) : (
                  <span className="font-medium text-ink dark:text-ink-dark">{formatCurrency(shippingFee)}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary dark:text-ink-secondary-dark">Tax (18% GST)</span>
                <span className="font-medium text-ink dark:text-ink-dark">{formatCurrency(tax)}</span>
              </div>

              {shippingFee > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                  Add {formatCurrency(999 - subtotal)} more for free shipping!
                </p>
              )}

              <div className="border-t border-surface-border dark:border-surface-border-dark pt-3 flex justify-between font-bold text-base">
                <span className="text-ink dark:text-ink-dark">Total</span>
                <span className="text-brand-500 text-lg">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={() => isAuthenticated ? navigate('/checkout') : navigate('/login?redirect=/checkout')}
              className="btn-primary w-full mt-4 py-3.5"
            >
              Proceed to Checkout <ArrowRight size={17} />
            </button>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-ink-muted dark:text-ink-muted-dark">
              <span className="flex items-center gap-1"><Shield size={12} /> Secure</span>
              <span className="flex items-center gap-1"><Truck size={12} /> Fast Delivery</span>
              <span className="flex items-center gap-1"><RefreshCcw size={12} /> Easy Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
