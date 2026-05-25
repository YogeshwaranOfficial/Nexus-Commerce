import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layers, Plus, Pencil, Trash2, X, ChevronRight } from 'lucide-react';
import { adminApi } from '../../services/api';
import { getApiError } from '../../utils';
import { EmptyState, Skeleton, Spinner } from '../../components/ui/index';
import { useUIStore } from '../../stores';
import { useSEO } from '../../hooks/useSEO';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
});
type CategoryForm = z.infer<typeof schema>;

function CategoryModal({ editing, categories, onClose }: { editing?: any; categories: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const { showNotification } = useUIStore();

  const { register, handleSubmit, formState: { errors } } = useForm<CategoryForm>({
    resolver: zodResolver(schema),
    defaultValues: editing ? {
      name: editing.name,
      description: editing.description,
      parentId: editing.parent || '',
      sortOrder: editing.sortOrder,
    } : { sortOrder: 0 },
  });

  const mutation = useMutation({
    mutationFn: (d: CategoryForm) =>
      editing
        ? adminApi.updateCategory(editing._id, { name: d.name, description: d.description, sortOrder: d.sortOrder })
        : adminApi.createCategory(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      showNotification('success', editing ? 'Category updated' : 'Category created');
      onClose();
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const rootCategories = categories.filter((c) => !c.parent);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#13131a] rounded-2xl shadow-2xl border border-surface-border dark:border-surface-border-dark overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border dark:border-surface-border-dark">
          <h3 className="font-bold text-ink dark:text-ink-dark">{editing ? 'Edit Category' : 'Add Category'}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Name *</label>
            <input {...register('name')} className="input" placeholder="e.g. Electronics" />
            {errors.name && <p className="text-xs text-red-500 mt-1">Required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Description</label>
            <textarea {...register('description')} rows={2} className="input resize-none" />
          </div>
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Parent Category</label>
              <select {...register('parentId')} className="input">
                <option value="">None (Root Category)</option>
                {rootCategories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Sort Order</label>
            <input {...register('sortOrder')} type="number" className="input" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 py-2.5 text-sm">
              {mutation.isPending ? <Spinner size={16} /> : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function AdminCategories() {
  useSEO({ title: 'Category Management', noIndex: true });
  const qc = useQueryClient();
  const { showNotification } = useUIStore();
  const [modal, setModal] = useState<null | 'new' | any>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories().then((r) => r.data.data.categories),
  });

  const categories: any[] = data || [];
  const rootCategories = categories.filter((c) => !c.parent);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const CategoryRow = ({ category, depth = 0 }: { category: any; depth?: number }) => {
    const children = categories.filter((c) => c.parent === category._id);
    const hasChildren = children.length > 0;
    const isExpanded = expanded.has(category._id);

    return (
      <>
        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
              {hasChildren ? (
                <button onClick={() => toggleExpand(category._id)} className="w-5 h-5 flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:text-brand-500 transition-colors">
                  <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
              ) : <div className="w-5 h-5" />}
              {category.image?.url && (
                <img src={category.image.url} alt={category.name} className="w-7 h-7 rounded-lg object-cover" />
              )}
              <span className="text-sm font-medium text-ink dark:text-ink-dark">{category.name}</span>
              {depth === 0 && <span className="badge text-2xs bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">Root</span>}
            </div>
          </td>
          <td className="px-4 py-3 text-xs text-ink-muted dark:text-ink-muted-dark">{category.description || '—'}</td>
          <td className="px-4 py-3 text-xs text-ink-muted dark:text-ink-muted-dark">{children.length} sub</td>
          <td className="px-4 py-3 text-xs text-ink-muted dark:text-ink-muted-dark">{category.sortOrder}</td>
          <td className="px-4 py-3">
            <span className={`badge text-2xs ${category.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
              {category.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-4 py-3">
            <div className="flex gap-1">
              <button onClick={() => setModal(category)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors">
                <Pencil size={13} />
              </button>
            </div>
          </td>
        </motion.tr>
        {hasChildren && isExpanded && children.map((child) => (
          <CategoryRow key={child._id} category={child} depth={depth + 1} />
        ))}
      </>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-ink dark:text-ink-dark flex items-center gap-2">
          <Layers size={22} className="text-brand-500" /> Categories
        </h1>
        <button onClick={() => setModal('new')} className="btn-primary text-sm py-2.5">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : categories.length === 0 ? (
          <EmptyState icon={<Layers size={28} />} title="No categories" description="Create your first category."
            action={<button onClick={() => setModal('new')} className="btn-primary text-sm py-2.5"><Plus size={16} /> Add Category</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border dark:border-surface-border-dark bg-surface-card dark:bg-surface-card-dark">
                  {['Name', 'Description', 'Subcategories', 'Order', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
                {rootCategories.map((cat) => <CategoryRow key={cat._id} category={cat} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && <CategoryModal editing={modal === 'new' ? undefined : modal} categories={categories} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
