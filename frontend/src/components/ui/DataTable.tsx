import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '../../utils';
import { Skeleton, EmptyState, Spinner } from './index';

export interface Column<T = any> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  pagination?: {
    page: number;
    pages: number;
    total: number;
    limit: number;
    onPageChange: (p: number) => void;
  };
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyAction,
  pagination,
  selectable,
  onSelectionChange,
  bulkActions,
  searchable,
  searchPlaceholder = 'Search…',
  className,
  rowClassName,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    if (!searchable || !search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor ? col.accessor(row) : (row as any)[col.key];
        return String(val ?? '').toLowerCase().includes(q);
      }),
    );
  }, [data, search, searchable, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      const dir = sortDir === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filteredData, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleSelectAll = (checked: boolean) => {
    const next = checked ? new Set(sortedData.map(keyExtractor)) : new Set<string>();
    setSelected(next);
    onSelectionChange?.(Array.from(next));
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
    onSelectionChange?.(Array.from(next));
  };

  const allSelected = sortedData.length > 0 && sortedData.every((r) => selected.has(keyExtractor(r)));
  const someSelected = selected.size > 0;

  const SortIcon = ({ col }: { col: Column }) => {
    if (!col.sortable) return null;
    if (sortKey !== col.key) return <ChevronsUpDown size={13} className="text-ink-muted dark:text-ink-muted-dark opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp size={13} className="text-brand-500" /> : <ChevronDown size={13} className="text-brand-500" />;
  };

  return (
    <div className={cn('card overflow-hidden', className)}>
      {/* Toolbar */}
      {(searchable || (someSelected && bulkActions)) && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border dark:border-surface-border-dark">
          {searchable && !someSelected && (
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder}
                className="input pl-8 py-2 text-sm" />
            </div>
          )}
          {someSelected && bulkActions && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark">{selected.size} selected</span>
              {bulkActions}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="p-4 space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : sortedData.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border dark:border-surface-border-dark bg-surface-card/50 dark:bg-surface-card-dark/50">
                {selectable && (
                  <th className="pl-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="accent-brand-500 w-4 h-4 rounded"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.width && `w-[${col.width}]`,
                      col.sortable && 'cursor-pointer select-none hover:text-ink dark:hover:text-ink-dark',
                      col.className,
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      <SortIcon col={col} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60 dark:divide-surface-border-dark/60">
              <AnimatePresence mode="popLayout">
                {sortedData.map((row) => {
                  const id = keyExtractor(row);
                  const isSelected = selected.has(id);
                  return (
                    <motion.tr
                      key={id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        'transition-colors',
                        isSelected
                          ? 'bg-brand-50/50 dark:bg-brand-950/20'
                          : 'hover:bg-surface-card/70 dark:hover:bg-surface-card-dark/70',
                        onRowClick && 'cursor-pointer',
                        rowClassName?.(row),
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <td className="pl-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(id, e.target.checked)}
                            className="accent-brand-500 w-4 h-4 rounded"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'px-4 py-3 text-sm',
                            col.align === 'center' && 'text-center',
                            col.align === 'right' && 'text-right',
                            col.className,
                          )}
                        >
                          {col.accessor ? col.accessor(row) : String((row as any)[col.key] ?? '—')}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border dark:border-surface-border-dark">
          <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="w-8 h-8 rounded-lg border border-surface-border dark:border-surface-border-dark flex items-center justify-center disabled:opacity-30 hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const p = Math.max(1, Math.min(pagination.page - 2, pagination.pages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => pagination.onPageChange(p)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-semibold transition-colors',
                    p === pagination.page
                      ? 'bg-brand-500 text-white'
                      : 'border border-surface-border dark:border-surface-border-dark text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark',
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="w-8 h-8 rounded-lg border border-surface-border dark:border-surface-border-dark flex items-center justify-center disabled:opacity-30 hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
