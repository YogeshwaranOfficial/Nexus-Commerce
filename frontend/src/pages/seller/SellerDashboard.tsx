import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle,
  Plus, ChevronRight, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { sellerApi } from '../../services/api';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../utils';
import { Skeleton } from '../../components/ui/index';
import { useSEO } from '../../hooks/useSEO';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = 'brand',
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  color?: string;
}) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-50 dark:bg-brand-950/30 text-brand-500',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-500',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 shadow-xl border border-surface-border dark:border-surface-border-dark">
      <p className="text-xs text-ink-muted dark:text-ink-muted-dark mb-1">{label}</p>
      <p className="text-sm font-bold text-brand-500">{formatCurrency(payload[0]?.value || 0)}</p>
      {payload[1] && <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{payload[1].value} orders</p>}
    </div>
  );
};

export default function SellerDashboard() {
  useSEO({ title: 'Seller Dashboard', noIndex: true });
  const [period, setPeriod] = useState('30d');

  const { data: dash, isLoading } = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: () => sellerApi.getDashboard().then((r) => r.data.data),
  });

  const { data: analytics } = useQuery({
    queryKey: ['seller-analytics', period],
    queryFn: () => sellerApi.getAnalytics(period).then((r) => r.data.data),
  });

  const stats = dash?.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink dark:text-ink-dark">Seller Dashboard</h1>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-0.5">Welcome back! Here's your business overview.</p>
        </div>
        <Link to="/seller/products/add" className="btn-primary text-sm py-2.5">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} sub="All time" color="green" />
            <StatCard icon={TrendingUp} label="This Month" value={formatCurrency(stats?.monthRevenue || 0)} color="brand" />
            <StatCard icon={ShoppingCart} label="Total Orders" value={String(stats?.totalOrders || 0)} color="purple" />
            <StatCard icon={Package} label="Products" value={`${stats?.publishedProducts || 0} / ${stats?.totalProducts || 0}`} sub="Published / Total" color="amber" />
          </>
        )}
      </div>

      {/* Revenue chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-ink dark:text-ink-dark">Revenue Overview</h3>
          <div className="flex gap-1">
            {['7d', '30d', '90d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p ? 'bg-brand-500 text-white' : 'text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={analytics?.salesData || []}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} stroke="transparent" tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} stroke="transparent" tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gradRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Low stock */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink dark:text-ink-dark flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Low Stock Alert
            </h3>
            <Link to="/seller/products" className="text-xs text-brand-500 font-semibold">View all</Link>
          </div>
          {dash?.lowStockProducts?.length ? (
            <div className="space-y-3">
              {dash.lowStockProducts.map((p: any) => (
                <div key={p._id} className="flex items-center gap-3">
                  <img src={p.images[0]?.url} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-surface-card dark:bg-surface-card-dark" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink dark:text-ink-dark line-clamp-1">{p.name}</p>
                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark">SKU: {p.sku}</p>
                  </div>
                  <span className={`badge text-xs font-bold ${p.stock === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted dark:text-ink-muted-dark text-center py-4">All products are well stocked 🎉</p>
          )}
        </div>

        {/* Recent orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink dark:text-ink-dark">Recent Orders</h3>
            <Link to="/seller/orders" className="text-xs text-brand-500 font-semibold">View all</Link>
          </div>
          {dash?.recentOrders?.length ? (
            <div className="space-y-3">
              {dash.recentOrders.slice(0, 5).map((order: any) => (
                <div key={order._id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {order.user?.avatar ? <img src={order.user.avatar} alt="" className="w-full h-full object-cover" /> : order.user?.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink dark:text-ink-dark">#{order.orderNumber}</p>
                    <p className="text-2xs text-ink-muted dark:text-ink-muted-dark">{order.user?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-ink dark:text-ink-dark">{formatCurrency(order.pricing?.total)}</p>
                    <span className={`badge text-2xs ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted dark:text-ink-muted-dark text-center py-4">No recent orders</p>
          )}
        </div>
      </div>
    </div>
  );
}


