import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { adminApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils';
import { Skeleton } from '../../components/ui/index';
import { useSEO } from '../../hooks/useSEO';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const Tooltip_ = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 shadow-xl border border-surface-border dark:border-surface-border-dark text-sm">
      <p className="text-xs text-ink-muted dark:text-ink-muted-dark mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('revenue') ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminAnalytics() {
  useSEO({ title: 'Analytics', noIndex: true });
  const [period, setPeriod] = useState('30d');

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['admin-analytics-sales', period],
    queryFn: () => adminApi.getSalesAnalytics(period).then((r) => r.data.data.salesData),
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-analytics-revenue', period],
    queryFn: () => adminApi.getRevenue(period).then((r) => r.data.data),
  });

  const PeriodPicker = () => (
    <div className="flex gap-1">
      {['7d', '30d', '90d', '1y'].map((p) => (
        <button key={p} onClick={() => setPeriod(p)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${period === p ? 'bg-brand-500 text-white' : 'bg-surface-card dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark text-ink-secondary dark:text-ink-secondary-dark'}`}>
          {p}
        </button>
      ))}
    </div>
  );

  const formatX = (v: string) => {
    try { return new Date(v).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }); } catch { return v; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-ink dark:text-ink-dark flex items-center gap-2">
          <TrendingUp size={22} className="text-brand-500" /> Analytics
        </h1>
        <PeriodPicker />
      </div>

      {/* Sales + Orders timeline */}
      <div className="card p-5">
        <h3 className="font-bold text-ink dark:text-ink-dark mb-4">Revenue & Orders Over Time</h3>
        {salesLoading ? <Skeleton className="h-56 rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={salesData || []}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.08)" />
              <XAxis dataKey="date" tickFormatter={formatX} tick={{ fontSize: 10 }} stroke="transparent" />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="transparent" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="transparent" />
              <Tooltip content={<Tooltip_ />} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gRev)" />
              <Area yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#10b981" strokeWidth={2} fill="url(#gOrd)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue by category */}
        <div className="card p-5">
          <h3 className="font-bold text-ink dark:text-ink-dark mb-4">Revenue by Category</h3>
          {revenueLoading ? <Skeleton className="h-48 rounded-xl" /> : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={revenueData?.revenueByCategory || []} dataKey="revenue" nameKey="_id.catName" cx="50%" cy="50%" outerRadius={80} innerRadius={45} strokeWidth={2} stroke="transparent">
                    {(revenueData?.revenueByCategory || []).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {(revenueData?.revenueByCategory || []).slice(0, 6).map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-ink-secondary dark:text-ink-secondary-dark flex-1 truncate">{c._id?.catName || 'Other'}</span>
                    <span className="font-bold text-ink dark:text-ink-dark shrink-0">{formatCurrency(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div className="card p-5">
          <h3 className="font-bold text-ink dark:text-ink-dark mb-4">Payment Methods</h3>
          {revenueLoading ? <Skeleton className="h-48 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData?.paymentMethods || []} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="transparent" />
                <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} stroke="transparent" width={80} tickFormatter={(v) => v === 'cod' ? 'Cash' : v.charAt(0).toUpperCase() + v.slice(1)} />
                <Tooltip formatter={(v: number, n: string) => [n === 'revenue' ? formatCurrency(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']} />
                <Bar dataKey="count" name="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                  {(revenueData?.paymentMethods || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top sellers table */}
      <div className="card p-5">
        <h3 className="font-bold text-ink dark:text-ink-dark mb-4">Top Sellers</h3>
        {revenueLoading ? <Skeleton className="h-40 rounded-xl" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border dark:border-surface-border-dark">
                  {['#', 'Seller', 'Revenue', 'Orders'].map((h) => (
                    <th key={h} className="text-left pb-2 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
                {(revenueData?.topSellers || []).map((s: any, i: number) => (
                  <tr key={s._id} className="hover:bg-surface-card dark:hover:bg-surface-card-dark">
                    <td className="py-2.5 pr-3 text-sm font-black text-ink-muted dark:text-ink-muted-dark">#{i + 1}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                          {s.seller?.avatar ? <img src={s.seller.avatar} alt="" className="w-full h-full object-cover" /> : s.seller?.name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink dark:text-ink-dark">{s.seller?.name}</p>
                          <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{s.seller?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-sm font-bold text-brand-500">{formatCurrency(s.revenue)}</td>
                    <td className="py-2.5 text-sm text-ink-secondary dark:text-ink-secondary-dark">{s.orders}</td>
                  </tr>
                ))}
                {!revenueData?.topSellers?.length && (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
