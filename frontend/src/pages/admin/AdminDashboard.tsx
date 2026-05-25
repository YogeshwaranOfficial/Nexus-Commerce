import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Package, ShoppingCart, DollarSign, TrendingUp,
  ArrowUpRight, ArrowDownRight, AlertCircle, Eye,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { adminApi } from '../../services/api';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../utils';
import { Skeleton } from '../../components/ui/index';
import { useSEO } from '../../hooks/useSEO';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 shadow-xl border border-surface-border dark:border-surface-border-dark text-sm">
      <p className="text-ink-muted dark:text-ink-muted-dark text-xs mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.name === 'revenue' || p.name === 'Revenue' ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

function KPICard({ icon: Icon, label, value, trend, sub, color }: any) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 dark:bg-brand-950/30 text-brand-500',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-500',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.brand}`}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-ink dark:text-ink-dark">{value}</p>
      <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-0.5">{label}</p>
      {sub && <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function AdminDashboard() {
  useSEO({ title: 'Admin Dashboard', noIndex: true });
  const [period, setPeriod] = useState('30d');

  const { data: dash, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard().then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: salesData } = useQuery({
    queryKey: ['admin-sales', period],
    queryFn: () => adminApi.getSalesAnalytics(period).then((r) => r.data.data.salesData),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['admin-revenue', period],
    queryFn: () => adminApi.getRevenue(period).then((r) => r.data.data),
  });

  const stats = dash?.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-ink dark:text-ink-dark">Admin Dashboard</h1>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-0.5">Real-time platform overview</p>
        </div>
        <div className="flex gap-1">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${period === p ? 'bg-brand-500 text-white' : 'bg-surface-card dark:bg-surface-card-dark border border-surface-border dark:border-surface-border-dark text-ink-secondary dark:text-ink-secondary-dark'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />) : (
          <>
            <KPICard icon={DollarSign} label="Revenue (Month)" value={formatCurrency(stats?.revenueThisMonth || 0)} trend={stats?.revenueGrowth} color="green" />
            <KPICard icon={Users} label="Total Users" value={(stats?.totalUsers || 0).toLocaleString()} sub={`+${stats?.newUsersThisMonth || 0} this month`} color="brand" />
            <KPICard icon={ShoppingCart} label="Total Orders" value={(stats?.totalOrders || 0).toLocaleString()} sub={`${stats?.ordersThisMonth || 0} this month`} color="purple" />
            <KPICard icon={Package} label="Products Live" value={(stats?.totalProducts || 0).toLocaleString()} sub={stats?.pendingReviews ? `${stats.pendingReviews} pending review` : undefined} color="amber" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Sales area chart */}
        <div className="card p-5">
          <h3 className="font-bold text-ink dark:text-ink-dark mb-4">Sales & Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData || []}>
              <defs>
                <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradO" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.1)" />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} tick={{ fontSize: 10 }} stroke="transparent" />
              <YAxis tick={{ fontSize: 10 }} stroke="transparent" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gradR)" />
              <Area type="monotone" dataKey="orders" name="Orders" stroke="#10b981" strokeWidth={2} fill="url(#gradO)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by category */}
        <div className="card p-5">
          <h3 className="font-bold text-ink dark:text-ink-dark mb-4">Revenue by Category</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie
                  data={revenueData?.revenueByCategory || []}
                  dataKey="revenue"
                  nameKey="_id.catName"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  strokeWidth={2}
                  stroke="transparent"
                >
                  {(revenueData?.revenueByCategory || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {(revenueData?.revenueByCategory || []).slice(0, 5).map((cat: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-ink-secondary dark:text-ink-secondary-dark truncate flex-1">{cat._id?.catName || 'Other'}</span>
                  <span className="font-semibold text-ink dark:text-ink-dark shrink-0">{formatCurrency(cat.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Order status + payment methods */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Order status distribution */}
        <div className="card p-5">
          <h3 className="font-bold text-ink dark:text-ink-dark mb-4">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dash?.orderStatusDist || []} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="transparent" />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 10 }} stroke="transparent" width={100}
                tickFormatter={(v) => ORDER_STATUS_LABELS[v] || v}
              />
              <Tooltip formatter={(v: number, name: string) => [v, 'Orders']} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                {(dash?.orderStatusDist || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink dark:text-ink-dark">Top Selling Products</h3>
            <Link to="/admin/products" className="text-xs text-brand-500 font-semibold">View all</Link>
          </div>
          <div className="space-y-3">
            {(dash?.topProducts || []).map((p: any, i: number) => (
              <div key={p._id} className="flex items-center gap-3">
                <span className="text-sm font-black text-ink-muted dark:text-ink-muted-dark w-5 shrink-0">#{i + 1}</span>
                <img src={p.images?.[0]?.url} alt={p.name} className="w-9 h-9 rounded-xl object-cover bg-surface-card dark:bg-surface-card-dark" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink dark:text-ink-dark line-clamp-1">{p.name}</p>
                  <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{p.analytics?.salesCount || 0} sold</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink dark:text-ink-dark">{formatCurrency(p.basePrice)}</p>
                  <div className="flex items-center gap-0.5 text-xs text-amber-400 justify-end">
                    <span>★</span><span className="text-ink-secondary dark:text-ink-secondary-dark">{p.ratings?.average?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink dark:text-ink-dark">Recent Orders</h3>
          <Link to="/admin/orders" className="text-xs text-brand-500 font-semibold">View all →</Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border dark:border-surface-border-dark">
                  {['Order', 'Customer', 'Total', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left pb-2 text-xs font-semibold text-ink-muted dark:text-ink-muted-dark uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
                {(dash?.recentOrders || []).map((order: any) => (
                  <tr key={order._id} className="hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors">
                    <td className="py-2.5 pr-3">
                      <span className="text-sm font-bold text-ink dark:text-ink-dark">#{order.orderNumber}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                          {order.user?.avatar ? <img src={order.user.avatar} alt="" className="w-full h-full object-cover" /> : order.user?.name?.[0]}
                        </div>
                        <span className="text-sm text-ink-secondary dark:text-ink-secondary-dark">{order.user?.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-sm font-semibold text-ink dark:text-ink-dark">{formatCurrency(order.pricing?.total)}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`badge text-xs ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
                    </td>
                    <td className="py-2.5 text-xs text-ink-muted dark:text-ink-muted-dark">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
