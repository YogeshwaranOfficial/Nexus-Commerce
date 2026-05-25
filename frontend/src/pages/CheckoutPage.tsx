import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin, CreditCard, CheckCircle2, ChevronRight,
  Plus, Truck, Wallet, Smartphone
} from 'lucide-react';
import { userApi, orderApi, paymentApi } from '../services/api';
import { useCartStore, useAuthStore, useUIStore, cartSubtotal, cartItemCount } from '../stores';
import { formatCurrency, getApiError } from '../utils';
import { Address } from '../types';
import { Spinner, Skeleton } from '../components/ui/index';
import { useSEO } from '../hooks/useSEO';

// Step indicator
function StepBar({ step }: { step: number }) {
  const steps = [
    { label: 'Address', icon: MapPin },
    { label: 'Payment', icon: CreditCard },
    { label: 'Review', icon: CheckCircle2 },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map(({ label, icon: Icon }, i) => (
        <div key={label} className="flex items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            i + 1 === step ? 'bg-brand-500 text-white' :
            i + 1 < step ? 'text-green-600 dark:text-green-400' :
            'text-ink-muted dark:text-ink-muted-dark'
          }`}>
            {i + 1 < step ? <CheckCircle2 size={16} className="fill-green-500 text-white" /> : <Icon size={16} />}
            <span className="text-sm font-semibold">{label}</span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={16} className="mx-1 text-surface-border dark:text-surface-border-dark" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Address ──────────────────────────────────────
const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(5).max(6),
  country: z.string().default('IN'),
});
type AddressForm = z.infer<typeof addressSchema>;

function AddressStep({
  selectedId,
  onSelect,
  onNext,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
}) {
  const [addingNew, setAddingNew] = useState(false);
  const { showNotification } = useUIStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userApi.getAddresses().then((r) => r.data.data.addresses as Address[]),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  const saveMutation = useMutation({
    mutationFn: (d: AddressForm) => userApi.addAddress(d),
    onSuccess: () => {
      refetch();
      setAddingNew(false);
      reset();
      showNotification('success', 'Address added');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  return (
    <div>
      <h2 className="text-lg font-bold text-ink dark:text-ink-dark mb-4 flex items-center gap-2">
        <MapPin size={18} className="text-brand-500" /> Delivery Address
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {data?.map((addr) => (
            <button
              key={addr._id}
              onClick={() => onSelect(addr._id!)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                selectedId === addr._id
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                  : 'border-surface-border dark:border-surface-border-dark hover:border-brand-200 dark:hover:border-brand-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-ink dark:text-ink-dark">{addr.fullName}</p>
                    <span className="badge bg-surface-card dark:bg-[#0d0d12] text-ink-muted dark:text-ink-muted-dark text-2xs border border-surface-border dark:border-surface-border-dark">
                      {addr.label || 'Home'}
                    </span>
                    {addr.isDefault && <span className="badge bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-2xs">Default</span>}
                  </div>
                  <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                  <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">📞 {addr.phone}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-1 transition-all ${
                  selectedId === addr._id ? 'border-brand-500 bg-brand-500' : 'border-surface-border dark:border-surface-border-dark'
                }`} />
              </div>
            </button>
          ))}

          <button
            onClick={() => setAddingNew(!addingNew)}
            className="w-full flex items-center gap-2 p-4 rounded-2xl border-2 border-dashed border-surface-border dark:border-surface-border-dark text-ink-secondary dark:text-ink-secondary-dark hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-500 transition-all text-sm font-medium"
          >
            <Plus size={16} /> Add New Address
          </button>
        </div>
      )}

      <AnimatePresence>
        {addingNew && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
            className="overflow-hidden"
          >
            <div className="card p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Full Name *</label>
                  <input {...register('fullName')} className="input py-2 text-sm" placeholder="John Doe" />
                  {errors.fullName && <p className="text-2xs text-red-500 mt-0.5">Required</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Phone *</label>
                  <input {...register('phone')} className="input py-2 text-sm" placeholder="+91 98765 43210" />
                  {errors.phone && <p className="text-2xs text-red-500 mt-0.5">Required</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Address Line 1 *</label>
                <input {...register('line1')} className="input py-2 text-sm" placeholder="Street address" />
                {errors.line1 && <p className="text-2xs text-red-500 mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Address Line 2</label>
                <input {...register('line2')} className="input py-2 text-sm" placeholder="Apartment, suite, etc." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">City *</label>
                  <input {...register('city')} className="input py-2 text-sm" placeholder="Mumbai" />
                  {errors.city && <p className="text-2xs text-red-500 mt-0.5">Required</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">State *</label>
                  <input {...register('state')} className="input py-2 text-sm" placeholder="Maharashtra" />
                  {errors.state && <p className="text-2xs text-red-500 mt-0.5">Required</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">PIN *</label>
                  <input {...register('postalCode')} className="input py-2 text-sm" placeholder="400001" />
                  {errors.postalCode && <p className="text-2xs text-red-500 mt-0.5">Required</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saveMutation.isPending} className="btn-primary text-sm py-2 px-5">
                  {saveMutation.isPending ? <Spinner size={15} /> : 'Save Address'}
                </button>
                <button type="button" onClick={() => setAddingNew(false)} className="btn-ghost text-sm py-2">Cancel</button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <button
        onClick={onNext}
        disabled={!selectedId}
        className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue to Payment <ChevronRight size={17} />
      </button>
    </div>
  );
}

// ─── Step 2: Payment ──────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'razorpay', label: 'UPI / Card / Net Banking', desc: 'Powered by Razorpay', icon: Smartphone },
  { id: 'stripe', label: 'International Card', desc: 'Powered by Stripe', icon: CreditCard },
  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: Truck },
  { id: 'wallet', label: 'Nexus Wallet', desc: 'Use your wallet balance', icon: Wallet },
];

function PaymentStep({
  selectedMethod,
  onSelect,
  onNext,
  onBack,
  walletBalance,
}: {
  selectedMethod: string;
  onSelect: (m: string) => void;
  onNext: () => void;
  onBack: () => void;
  walletBalance: number;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-ink dark:text-ink-dark mb-4 flex items-center gap-2">
        <CreditCard size={18} className="text-brand-500" /> Payment Method
      </h2>

      <div className="space-y-3 mb-6">
        {PAYMENT_METHODS.map(({ id, label, desc, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
              selectedMethod === id
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                : 'border-surface-border dark:border-surface-border-dark hover:border-brand-200 dark:hover:border-brand-800'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              selectedMethod === id ? 'bg-brand-500 text-white' : 'bg-surface-card dark:bg-surface-card-dark text-ink-muted dark:text-ink-muted-dark'
            }`}>
              <Icon size={18} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-ink dark:text-ink-dark">{label}</p>
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">
                {id === 'wallet' ? `Balance: ${formatCurrency(walletBalance)}` : desc}
              </p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${
              selectedMethod === id ? 'border-brand-500 bg-brand-500' : 'border-surface-border dark:border-surface-border-dark'
            }`} />
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1 py-3">Back</button>
        <button onClick={onNext} disabled={!selectedMethod} className="btn-primary flex-1 py-3 disabled:opacity-50">
          Review Order <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Review & Place Order ─────────────────────────
function ReviewStep({
  addressId,
  paymentMethod,
  onBack,
  onPlaceOrder,
  isPlacing,
}: {
  addressId: string;
  paymentMethod: string;
  onBack: () => void;
  onPlaceOrder: () => void;
  isPlacing: boolean;
}) {
  const { items, couponCode, couponDiscount } = useCartStore();
  const subtotal = cartSubtotal(items);
  const shippingFee = subtotal >= 999 ? 0 : 99;
  const tax = Math.round((subtotal - couponDiscount) * 0.18);
  const total = subtotal - couponDiscount + shippingFee + tax;

  const { data: addressData } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userApi.getAddresses().then((r) => r.data.data.addresses as Address[]),
  });

  const address = addressData?.find((a) => a._id === addressId);

  return (
    <div>
      <h2 className="text-lg font-bold text-ink dark:text-ink-dark mb-4 flex items-center gap-2">
        <CheckCircle2 size={18} className="text-brand-500" /> Review & Place Order
      </h2>

      {/* Items */}
      <div className="card p-4 mb-4 space-y-3">
        <p className="text-sm font-semibold text-ink dark:text-ink-dark mb-3">Order Items ({items.length})</p>
        {items.map((item) => (
          <div key={`${item.productId}:${item.variantId}`} className="flex items-center gap-3">
            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-surface-card dark:bg-surface-card-dark" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink dark:text-ink-dark font-medium line-clamp-1">{item.name}</p>
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-semibold text-ink dark:text-ink-dark shrink-0">{formatCurrency(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      {/* Address */}
      {address && (
        <div className="card p-4 mb-4">
          <p className="text-sm font-semibold text-ink dark:text-ink-dark mb-2">Delivering to</p>
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">{address.fullName}</p>
          <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
            {address.line1}, {address.city}, {address.state} {address.postalCode}
          </p>
          <p className="text-xs text-ink-muted dark:text-ink-muted-dark">📞 {address.phone}</p>
        </div>
      )}

      {/* Totals */}
      <div className="card p-4 mb-5 space-y-2 text-sm">
        <div className="flex justify-between text-ink-secondary dark:text-ink-secondary-dark">
          <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Coupon ({couponCode})</span><span>−{formatCurrency(couponDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-ink-secondary dark:text-ink-secondary-dark">
          <span>Shipping</span>
          <span>{shippingFee === 0 ? <span className="text-green-600 dark:text-green-400">FREE</span> : formatCurrency(shippingFee)}</span>
        </div>
        <div className="flex justify-between text-ink-secondary dark:text-ink-secondary-dark">
          <span>Tax (GST 18%)</span><span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-surface-border dark:border-surface-border-dark pt-2">
          <span className="text-ink dark:text-ink-dark">Total</span>
          <span className="text-brand-500">{formatCurrency(total)}</span>
        </div>
        <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
          Payment via: <span className="font-medium capitalize">{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}</span>
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1 py-3">Back</button>
        <button onClick={onPlaceOrder} disabled={isPlacing} className="btn-primary flex-1 py-3.5 disabled:opacity-60">
          {isPlacing ? <><Spinner size={17} /> Placing Order…</> : `Place Order · ${formatCurrency(total)}`}
        </button>
      </div>
    </div>
  );
}

// ─── Main CheckoutPage ────────────────────────────────────
export default function CheckoutPage() {
  useSEO({ title: 'Checkout', noIndex: true });
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const { clearCart, couponCode, couponDiscount, items } = useCartStore();
  const subtotal = cartSubtotal(items);
  const { user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  const placeOrderMutation = useMutation({
    mutationFn: () =>
      orderApi.checkout({
        addressId: selectedAddress,
        paymentMethod,
        couponCode: couponCode || undefined,
        walletAmount: paymentMethod === 'wallet' ? (user?.walletBalance || 0) : 0,
      }),
    onSuccess: async (res) => {
      const order = res.data.data.order;
      clearCart();

      if (paymentMethod === 'cod') {
        navigate(`/order-success/${order._id}`);
        return;
      }

      if (paymentMethod === 'razorpay') {
        try {
          const rzpRes = await paymentApi.createRazorpayOrder(order._id);
          const { orderId: rzpOrderId, amount, keyId } = rzpRes.data.data;

          const rzp = new (window as any).Razorpay({
            key: keyId,
            amount,
            currency: 'INR',
            order_id: rzpOrderId,
            name: 'Nexus Commerce',
            description: `Order #${order.orderNumber}`,
            handler: async (response: any) => {
              await paymentApi.verifyRazorpay({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order._id,
              });
              navigate(`/order-success/${order._id}`);
            },
            prefill: { name: user?.name, email: user?.email },
            theme: { color: '#6366f1' },
          });
          rzp.open();
        } catch {
          navigate(`/order-success/${order._id}`);
        }
      } else {
        navigate(`/order-success/${order._id}`);
      }
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-black text-ink dark:text-ink-dark text-center mb-2">Checkout</h1>
      <StepBar step={step} />

      <div className="card p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <AddressStep
                selectedId={selectedAddress}
                onSelect={setSelectedAddress}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <PaymentStep
                selectedMethod={paymentMethod}
                onSelect={setPaymentMethod}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
                walletBalance={user?.walletBalance || 0}
              />
            )}
            {step === 3 && (
              <ReviewStep
                addressId={selectedAddress!}
                paymentMethod={paymentMethod}
                onBack={() => setStep(2)}
                onPlaceOrder={() => placeOrderMutation.mutate()}
                isPlacing={placeOrderMutation.isPending}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
