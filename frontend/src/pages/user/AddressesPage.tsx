import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Plus, Pencil, Trash2, Star, X } from 'lucide-react';
import { userApi } from '../../services/api';
import { Address } from '../../types';
import { useUIStore } from '../../stores';
import { getApiError } from '../../utils';
import { EmptyState, Skeleton, Spinner } from '../../components/ui/index';
import { useSEO } from '../../hooks/useSEO';

const addressSchema = z.object({
  label: z.string().default('Home'),
  fullName: z.string().min(2, 'Required'),
  phone: z.string().min(10, 'Enter valid phone'),
  line1: z.string().min(5, 'Required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  postalCode: z.string().min(5).max(6),
  country: z.string().default('IN'),
  isDefault: z.boolean().default(false),
});
type AddressForm = z.infer<typeof addressSchema>;

const LABELS = ['Home', 'Work', 'Other'];

function AddressFormModal({
  editing,
  onClose,
}: {
  editing?: Address;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { showNotification } = useUIStore();

  const { register, handleSubmit, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: editing ? {
      label: editing.label || 'Home',
      fullName: editing.fullName,
      phone: editing.phone,
      line1: editing.line1,
      line2: editing.line2 || '',
      city: editing.city,
      state: editing.state,
      postalCode: editing.postalCode,
      country: editing.country || 'IN',
      isDefault: editing.isDefault || false,
    } : { label: 'Home', country: 'IN', isDefault: false },
  });

  const mutation = useMutation({
    mutationFn: (d: AddressForm) =>
      editing
        ? userApi.updateAddress(editing._id!, d)
        : userApi.addAddress(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      showNotification('success', editing ? 'Address updated' : 'Address added');
      onClose();
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-white dark:bg-[#13131a] rounded-2xl shadow-2xl border border-surface-border dark:border-surface-border-dark overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border dark:border-surface-border-dark">
          <h3 className="font-bold text-ink dark:text-ink-dark">{editing ? 'Edit Address' : 'Add New Address'}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1.5">Label</label>
            <div className="flex gap-2">
              {LABELS.map((l) => (
                <label key={l} className="flex-1">
                  <input {...register('label')} type="radio" value={l} className="sr-only peer" />
                  <div className="text-center py-2 rounded-xl border-2 border-surface-border dark:border-surface-border-dark peer-checked:border-brand-500 peer-checked:bg-brand-50 dark:peer-checked:bg-brand-950/30 peer-checked:text-brand-600 dark:peer-checked:text-brand-400 text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark cursor-pointer transition-all">
                    {l}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Full Name *</label>
              <input {...register('fullName')} className="input py-2.5 text-sm" />
              {errors.fullName && <p className="text-2xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Phone *</label>
              <input {...register('phone')} className="input py-2.5 text-sm" />
              {errors.phone && <p className="text-2xs text-red-500 mt-0.5">Required</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Address Line 1 *</label>
            <input {...register('line1')} className="input py-2.5 text-sm" />
            {errors.line1 && <p className="text-2xs text-red-500 mt-0.5">Required</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">Address Line 2</label>
            <input {...register('line2')} className="input py-2.5 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">City *</label>
              <input {...register('city')} className="input py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">State *</label>
              <input {...register('state')} className="input py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink dark:text-ink-dark mb-1">PIN *</label>
              <input {...register('postalCode')} className="input py-2.5 text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" {...register('isDefault')} className="accent-brand-500 w-4 h-4 rounded" />
            <span className="text-sm text-ink-secondary dark:text-ink-secondary-dark">Set as default address</span>
          </label>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 py-2.5">
              {mutation.isPending ? <Spinner size={16} /> : editing ? 'Update' : 'Save Address'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function AddressesPage() {
  useSEO({ title: 'My Addresses', noIndex: true });
  const qc = useQueryClient();
  const { showNotification } = useUIStore();
  const [modal, setModal] = useState<null | 'new' | Address>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userApi.getAddresses().then((r) => r.data.data.addresses as Address[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      showNotification('success', 'Address deleted');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: string) => userApi.setDefaultAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      showNotification('success', 'Default address updated');
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-ink dark:text-ink-dark">Saved Addresses</h1>
        <button onClick={() => setModal('new')} className="btn-primary text-sm py-2.5">
          <Plus size={16} /> Add Address
        </button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={<MapPin size={32} />}
          title="No addresses saved"
          description="Add a delivery address to make checkout faster."
          action={<button onClick={() => setModal('new')} className="btn-primary text-sm py-2.5"><Plus size={16} /> Add Address</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.map((addr, i) => (
            <motion.div
              key={addr._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card p-4 relative ${addr.isDefault ? 'border-brand-300 dark:border-brand-700' : ''}`}
            >
              {addr.isDefault && (
                <span className="absolute top-3 right-3 badge bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-2xs">
                  <Star size={10} className="fill-current" /> Default
                </span>
              )}

              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge bg-surface-card dark:bg-[#0d0d12] text-ink-secondary dark:text-ink-secondary-dark border border-surface-border dark:border-surface-border-dark text-2xs">
                    {addr.label || 'Home'}
                  </span>
                </div>
                <p className="font-semibold text-sm text-ink dark:text-ink-dark">{addr.fullName}</p>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark leading-relaxed mt-0.5">
                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                  {addr.city}, {addr.state} – {addr.postalCode}
                </p>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">📞 {addr.phone}</p>
              </div>

              <div className="flex items-center gap-2 border-t border-surface-border dark:border-surface-border-dark pt-3">
                <button
                  onClick={() => setModal(addr)}
                  className="flex items-center gap-1 text-xs text-ink-secondary dark:text-ink-secondary-dark hover:text-brand-500 transition-colors font-medium"
                >
                  <Pencil size={12} /> Edit
                </button>
                {!addr.isDefault && (
                  <>
                    <span className="text-surface-border dark:text-surface-border-dark">·</span>
                    <button
                      onClick={() => defaultMutation.mutate(addr._id!)}
                      className="flex items-center gap-1 text-xs text-ink-secondary dark:text-ink-secondary-dark hover:text-brand-500 transition-colors font-medium"
                    >
                      <Star size={12} /> Set Default
                    </button>
                    <span className="text-surface-border dark:text-surface-border-dark">·</span>
                    <button
                      onClick={() => deleteMutation.mutate(addr._id!)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors font-medium"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <AddressFormModal
            editing={modal === 'new' ? undefined : modal}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
