'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Package, CheckCircle, Clock, AlertCircle, TrendingUp,
  DollarSign, BarChart2, Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';

interface ProductAnalyticsData {
  total_products: number;
  status_counts: Record<string, number>;
  top_by_quantity: Array<{ id: number; title: string; total_quantity: number; velocity: number }>;
  top_by_revenue: Array<{ id: number; title: string; total_revenue: number }>;
  unsold_count: number;
  stock_buckets: Record<string, number>;
  price_buckets: Record<string, number>;
  monthly_products: Array<{ month: string; count: number }>;
  monthly_sales: Array<{ month: string; quantity: number; revenue: number }>;
}

export default function ProductAnalyticsPage() {
  const [data, setData] = useState<ProductAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics/products')
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading product analytics...</div>;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  const stockData = Object.entries(data.stock_buckets).map(([range, count]) => ({ range, count }));
  const priceData = Object.entries(data.price_buckets).map(([range, count]) => ({ range, count }));
  const avgVelocity = data.top_by_quantity.length > 0
    ? (data.top_by_quantity.reduce((sum, p) => sum + p.velocity, 0) / data.top_by_quantity.length).toFixed(2)
    : '0';
  const totalRevenue = data.monthly_sales.reduce((sum, m) => sum + m.revenue, 0).toFixed(2);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Product Analytics</h1>

      {/* Summary Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Products" value={data.total_products} icon={<Package className="text-blue-600" size={24} />} color="blue" />
        <MetricCard title="Active Products" value={data.status_counts?.active || 0} icon={<CheckCircle className="text-green-600" size={24} />} color="green" />
        <MetricCard title="Pending Review" value={data.status_counts?.pending_review || 0} icon={<Clock className="text-yellow-600" size={24} />} color="yellow" />
        <MetricCard title="Unsold Products" value={data.unsold_count} subtitle="Active with no sales" icon={<AlertCircle className="text-red-600" size={24} />} color="red" />
      </div>

      {/* Summary Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard title="Avg. Sales Velocity" value={`${avgVelocity} units/day`} subtitle="Top 10 products average" icon={<TrendingUp className="text-purple-600" size={24} />} color="purple" />
        <MetricCard title="Total Revenue (Wholesale)" value={`$${totalRevenue}`} subtitle="Last 12 months" icon={<DollarSign className="text-indigo-600" size={24} />} color="indigo" />
      </div>

      {/* Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><TrendingUp className="text-indigo-600" size={20} /> Top Products by Quantity Sold</h2>
          <div className="space-y-3">
            {data.top_by_quantity.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-5">{idx + 1}.</span>
                  <span className="font-medium truncate max-w-[180px]">{p.title}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold">{p.total_quantity} units</span>
                  <span className="text-xs text-gray-400 block">{p.velocity} units/day</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><DollarSign className="text-indigo-600" size={20} /> Top Products by Revenue</h2>
          <div className="space-y-3">
            {data.top_by_revenue.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-5">{idx + 1}.</span>
                  <span className="font-medium truncate max-w-[180px]">{p.title}</span>
                </div>
                <span className="font-bold">${p.total_revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock & Price Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Inventory Distribution (Active Products)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Price Distribution of Sold Products</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Sales Trend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Monthly Sales Trend (Last 12 Months)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly_sales.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={(v) => new Date(v).toLocaleString('default', { month: 'short' })} />
              <YAxis yAxisId="left" orientation="left" stroke="#4F46E5" />
              <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
              <Tooltip formatter={(value, name) => [name === 'quantity' ? `${value} units` : `$${value}`, name]} />
              <Legend />
              <Bar yAxisId="left" dataKey="quantity" fill="#4F46E5" name="Units Sold" />
              <Bar yAxisId="right" dataKey="revenue" fill="#10B981" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly New Products */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">New Products Added (Last 12 Months)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly_products.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={(v) => new Date(v).toLocaleString('default', { month: 'short' })} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---------- Shared MetricCard Component ----------
function MetricCard({ title, value, subtitle, icon, color }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'teal' | 'yellow' | 'red' | 'gray';
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-100', green: 'bg-green-100', purple: 'bg-purple-100', orange: 'bg-orange-100',
    indigo: 'bg-indigo-100', teal: 'bg-teal-100', yellow: 'bg-yellow-100', red: 'bg-red-100', gray: 'bg-gray-100',
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
      <div className={`p-3 rounded-full ${bgColors[color]}`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}