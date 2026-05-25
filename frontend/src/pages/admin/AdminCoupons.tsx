import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag, Plus, Trash2, X, Pencil } from 'lucide-react';
import { adminApi } from '../../services/api';
import { formatDate, formatCurrency, getApiError } from '../../utils';
import { EmptyState, Skeleton, Spinner } from '../../components/ui/index';
import { useUIStore } from '../../stores';
import { useSEO } from '../../hooks/useSEO';

const schema = z.object({
  code: z.string().min(3).toUpperCase(),
  type: z.enum(['percentage', 'fixed', 'free_shipping']),
  value: z.coerce.number().min(0),
  minOrderValue: z.coerce.number().default(0),
  maxDiscount: z.coerce.number().optional(),
  usageLimit: z.coerce.number().optional(),
  expiresAt: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});
type CouponForm = z.infer<typeof schema>;

function CouponModal({ editing, onClose }: { editing?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { showNotification } = useUIStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CouponForm>({
    resolver: zodResolver(schema),
    defaultValues: editing ? {
      code: editing.code,
      type: editing.type,
      value: editing.value,
      minOrderValue: editing.minOrderValue,
      maxDiscount: editing.maxDiscount,
      usageLimit: editing.usageLimit,
      expiresAt: editing.expiresAt?.slice(0, 10),
      description: editing.description,
      isActive: editing.isActive,
    } : { type: 'percentage', isActive: true, minOrderValue: 0 },
  });

  const type = watch('type');

  const mutation = useMutation({
    mutationFn: (d: CouponForm) =>
      editing ? adminApi.updateCoupon(editing._id, d) : adminApi.createCoupon(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      showNotification('success', editing ? 'Coupon updated' : 'Coupon created');
      onClose();
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#13131a] rounded-2xl shadow-2xl border border-surface-border dark:border-surface-border-dark overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border dark:border-surface-border-dark">
          <h3 className="font-bold text-ink dark:text-ink-dark">{editing ? 'Edit Coupon' : 'Create Coupon'}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Code *</label>
              <input {...register('code')} className="input py-2 text-sm uppercase" placeholder="SAVE20" />
              {errors.code && <p className="text-2xs text-red-500 mt-0.5">Required (min 3 chars)</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Type *</label>
              <select {...register('type')} className="input py-2 text-sm">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
          </div>
          {type !== 'free_shipping' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">
                  {type === 'percentage' ? 'Discount %' : 'Discount ₹'} *
                </label>
                <input {...register('value')} type="number" step="0.01" className="input py-2 text-sm" />
              </div>
              {type === 'percentage' && (
                <div>
                  <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Max Discount (₹)</label>
                  <input {...register('maxDiscount')} type="number" className="input py-2 text-sm" placeholder="No limit" />
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Min Order (₹)</label>
              <input {...register('minOrderValue')} type="number" className="input py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Usage Limit</label>
              <input {...register('usageLimit')} type="number" className="input py-2 text-sm" placeholder="Unlimited" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Expires At *</label>
            <input {...register('expiresAt')} type="date" className="input py-2 text-sm" />
            {errors.expiresAt && <p className="text-2xs text-red-500 mt-0.5">Required</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Description</label>
            <input {...register('description')} className="input py-2 text-sm" placeholder="Short description for customers" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="accent-brand-500 w-4 h-4" />
            <span className="text-sm text-ink-secondary dark:text-ink-secondary-dark">Active</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 py-2.5 text-sm">
              {mutation.isPending ? <Spinner size={16} /> : editing ? 'Update' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function AdminCoupons() {
  useSEO({ title: 'Coupon Management', noIndex: true });
  const qc = useQueryClient();
  const { showNotification } = useUIStore();
  const [modal, setModal] = useState<null | 'new' | any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminApi.getCoupons().then((r) => r.data.data.coupons),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCoupon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      showNotification('success', 'Coupon deleted');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const coupons: any[] = data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-ink dark:text-ink-dark flex items-center gap-2">
          <Tag size={22} className="text-brand-500" /> Coupons
        </h1>
        <button onClick={() => setModal('new')} className="btn-primary text-sm py-2.5">
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : coupons.length === 0 ? (
        <EmptyState icon={<Tag size={28} />} title="No coupons" description="Create your first coupon to offer discounts."
          action={<button onClick={() => setModal('new')} className="btn-primary text-sm py-2.5"><Plus size={16} /> Create Coupon</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => {
            const expired = new Date(coupon.expiresAt) < new Date();
            return (
              <motion.div key={coupon._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className={`card p-4 border-l-4 ${coupon.isActive && !expired ? 'border-l-brand-500' : 'border-l-surface-border dark:border-l-surface-border-dark opacity-70'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-black text-lg text-ink dark:text-ink-dark font-mono tracking-wider">{coupon.code}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <span className="badge text-2xs bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 capitalize">{coupon.type.replace('_', ' ')}</span>
                      {!coupon.isActive && <span className="badge text-2xs bg-surface-card dark:bg-[#0d0d12] text-ink-muted dark:text-ink-muted-dark border border-surface-border dark:border-surface-border-dark">Inactive</span>}
                      {expired && <span className="badge text-2xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Expired</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModal(coupon)} className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => { if (window.confirm(`Delete coupon "${coupon.code}"?`)) deleteMutation.mutate(coupon._id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-muted dark:text-ink-muted-dark text-xs">Discount</span>
                    <span className="font-semibold text-ink dark:text-ink-dark text-xs">
                      {coupon.type === 'percentage' ? `${coupon.value}%${coupon.maxDiscount ? ` (max ₹${coupon.maxDiscount})` : ''}` :
                        coupon.type === 'fixed' ? formatCurrency(coupon.value) : 'Free Shipping'}
                    </span>
                  </div>
                  {coupon.minOrderValue > 0 && (
                    <div className="flex justify-between">
                      <span className="text-ink-muted dark:text-ink-muted-dark text-xs">Min Order</span>
                      <span className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{formatCurrency(coupon.minOrderValue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-muted dark:text-ink-muted-dark text-xs">Usage</span>
                    <span className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                      {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''} used
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted dark:text-ink-muted-dark text-xs">Expires</span>
                    <span className={`text-xs font-medium ${expired ? 'text-red-500' : 'text-ink-secondary dark:text-ink-secondary-dark'}`}>
                      {formatDate(coupon.expiresAt)}
                    </span>
                  </div>
                  {coupon.description && (
                    <p className="text-2xs text-ink-muted dark:text-ink-muted-dark pt-1 border-t border-surface-border dark:border-surface-border-dark">{coupon.description}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {modal && <CouponModal editing={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
