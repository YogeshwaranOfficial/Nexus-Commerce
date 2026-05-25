import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';
import { useCartStore, cartSubtotal, cartItemCount } from '../../stores';
import { formatCurrency } from '../../utils';
import { useScrollLock } from '../../hooks';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { isOpen, closeCart, items, removeItem, updateQuantity, couponDiscount } = useCartStore();
  const subtotal = cartSubtotal(items);
  const itemCount = cartItemCount(items);
  useScrollLock(isOpen);

  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal - couponDiscount + shipping;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#0d0d12] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border dark:border-surface-border-dark">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-brand-500" />
                <h2 className="font-semibold text-ink dark:text-ink-dark">
                  Cart <span className="text-ink-muted dark:text-ink-muted-dark font-normal">({itemCount})</span>
                </h2>
              </div>
              <button onClick={closeCart} className="btn-ghost p-2 rounded-xl">
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-5">
              <AnimatePresence mode="popLayout">
                {items.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center py-16"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark flex items-center justify-center mb-4">
                      <ShoppingBag size={28} className="text-ink-muted dark:text-ink-muted-dark" />
                    </div>
                    <h3 className="font-semibold text-ink dark:text-ink-dark mb-1">Your cart is empty</h3>
                    <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark mb-5">
                      Add products to your cart to get started
                    </p>
                    <button onClick={() => { closeCart(); navigate('/products'); }} className="btn-primary text-sm py-2.5">
                      Browse Products
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <motion.div
                        key={`${item.productId}:${item.variantId || ''}`}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-3 p-3 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark"
                      >
                        {/* Image */}
                        <Link to={`/products/${item.productId}`} onClick={closeCart} className="shrink-0">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-[#0d0d12]">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink dark:text-ink-dark line-clamp-1">{item.name}</p>
                          {item.attributes && Object.keys(item.attributes).length > 0 && (
                            <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">
                              {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-brand-500 mt-1">
                            {formatCurrency(item.price * item.quantity)}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            {/* Qty */}
                            <div className="flex items-center gap-0.5 bg-white dark:bg-[#0d0d12] rounded-lg border border-surface-border dark:border-surface-border-dark">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                                className="w-7 h-7 flex items-center justify-center text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark transition-colors"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold text-ink dark:text-ink-dark">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                                disabled={item.quantity >= item.stock}
                                className="w-7 h-7 flex items-center justify-center text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark transition-colors disabled:opacity-40"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            {/* Remove */}
                            <button
                              onClick={() => removeItem(item.productId, item.variantId)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-muted dark:text-ink-muted-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-surface-border dark:border-surface-border-dark p-5 space-y-4">
                {/* Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-ink-secondary dark:text-ink-secondary-dark">
                    <span>Subtotal</span>
                    <span className="font-medium text-ink dark:text-ink-dark">{formatCurrency(subtotal)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span className="flex items-center gap-1"><Tag size={12} /> Coupon</span>
                      <span>−{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-ink-secondary dark:text-ink-secondary-dark">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'font-medium text-ink dark:text-ink-dark'}>
                      {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                      Add {formatCurrency(999 - subtotal)} more for free shipping
                    </p>
                  )}
                  <div className="flex justify-between font-semibold text-base border-t border-surface-border dark:border-surface-border-dark pt-2">
                    <span className="text-ink dark:text-ink-dark">Total</span>
                    <span className="text-brand-500">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => { closeCart(); navigate('/checkout'); }}
                  className="btn-primary w-full"
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </button>

                <button onClick={() => { closeCart(); navigate('/cart'); }} className="w-full text-sm text-center text-ink-secondary dark:text-ink-secondary-dark hover:text-brand-500 transition-colors">
                  View full cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
