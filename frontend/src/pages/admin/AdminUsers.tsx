import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Search, Shield, ShieldOff, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { adminApi } from '../../services/api';
import { formatDate, getApiError } from '../../utils';
import { EmptyState, Skeleton, Badge } from '../../components/ui/index';
import { useUIStore } from '../../stores';
import { useDebounce } from '../../hooks';
import { useSEO } from '../../hooks/useSEO';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  seller: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  user: 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400',
};

export default function AdminUsers() {
  useSEO({ title: 'User Management', noIndex: true });
  const qc = useQueryClient();
  const { showNotification } = useUIStore();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch, role, page],
    queryFn: () =>
      adminApi.getUsers({ search: debouncedSearch || undefined, role: role || undefined, page, limit: 20 }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      adminApi.updateUser(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      showNotification('success', 'User updated');
      setOpenMenu(null);
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const users: any[] = data?.users ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-ink dark:text-ink-dark flex items-center gap-2">
          <Users size={22} className="text-brand-500" /> User Management
        </h1>
        {pagination && (
          <span className="badge bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
            {pagination.total.toLocaleString()} total users
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email…" className="input pl-9 py-2.5 text-sm" />
        </div>
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="input py-2.5 text-sm w-auto">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : users.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title="No users found" description="Try different search terms." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border dark:border-surface-border-dark bg-surface-card dark:bg-surface-card-dark">
                    {['User', 'Role', 'Status', 'Joined', 'Last Login', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
                  {users.map((user) => (
                    <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                            {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink dark:text-ink-dark">{user.name}</p>
                            <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${ROLE_COLORS[user.role]}`}>{user.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${user.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted dark:text-ink-muted-dark">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-ink-muted dark:text-ink-muted-dark">
                        {user.lastLogin ? formatDate(user.lastLogin) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === user._id ? null : user._id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted dark:text-ink-muted-dark hover:bg-surface-card dark:hover:bg-[#1a1a2e] transition-colors"
                          >
                            <MoreVertical size={15} />
                          </button>
                          {openMenu === user._id && (
                            <div className="absolute right-0 top-8 w-44 card shadow-xl z-20 py-1 overflow-hidden">
                              {user.role !== 'admin' && (
                                <button
                                  onClick={() => updateMutation.mutate({ id: user._id, updates: { role: user.role === 'seller' ? 'user' : 'seller' } })}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark"
                                >
                                  <Shield size={14} />
                                  {user.role === 'seller' ? 'Revoke Seller' : 'Make Seller'}
                                </button>
                              )}
                              <button
                                onClick={() => updateMutation.mutate({ id: user._id, updates: { isActive: !user.isActive } })}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${user.isActive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                              >
                                <ShieldOff size={14} />
                                {user.isActive ? 'Suspend' : 'Activate'}
                              </button>
                              {user.role !== 'admin' && (
                                <button
                                  onClick={() => updateMutation.mutate({ id: user._id, updates: { role: 'admin' } })}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Shield size={14} /> Promote Admin
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border dark:border-surface-border-dark">
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  Page {page} of {pagination.pages}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-8 h-8 rounded-lg border border-surface-border dark:border-surface-border-dark flex items-center justify-center disabled:opacity-40">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                    className="w-8 h-8 rounded-lg border border-surface-border dark:border-surface-border-dark flex items-center justify-center disabled:opacity-40">
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
