'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package, TrendingUp, Users, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SupplierAnalyticsData {
  total_products: number;
  top_sellers: Array<{ id: number; business_name: string; total_revenue: number }>;
  top_listers: Array<{ id: number; business_name: string; product_count: number }>;
  product_buckets: Record<string, number>;
  monthly_products: Array<{ month: string; count: number }>;
}

export default function SupplierAnalytics() {
  const [data, setData] = useState<SupplierAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics/suppliers')
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading supplier analytics...</div>;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  const bucketData = Object.entries(data.product_buckets).map(([range, count]) => ({ range, count }));

  return (
    <div className="space-y-8">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Products Listed"
          value={data.total_products}
          icon={<Package className="text-blue-600" size={24} />}
          color="blue"
        />
        <MetricCard
          title="Active Suppliers"
          value={data.top_sellers.length} // Actually need total approved suppliers, add to backend if desired
          icon={<Users className="text-green-600" size={24} />}
          color="green"
        />
        <MetricCard
          title="Avg Products/Supplier"
          value={data.top_listers.length > 0 ? Math.round(data.total_products / data.top_listers.length) : 0}
          icon={<Layers className="text-purple-600" size={24} />}
          color="purple"
        />
      </div>

      {/* Top Sellers & Top Listers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={20} /> Top Sellers (by Revenue)
          </h2>
          <div className="space-y-3">
            {data.top_sellers.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-5">{idx + 1}.</span>
                  <span className="font-medium">{s.business_name}</span>
                </div>
                <span className="font-bold">${s.total_revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="text-indigo-600" size={20} /> Most Active Listers (by Product Count)
          </h2>
          <div className="space-y-3">
            {data.top_listers.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-5">{idx + 1}.</span>
                  <span className="font-medium">{s.business_name}</span>
                </div>
                <span className="font-bold">{s.product_count} products</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Distribution Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Products per Supplier Distribution</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bucketData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly New Products Trend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">New Products Added (Last 12 Months)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly_products.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={(v) => new Date(v).toLocaleString('default', { month: 'short' })} />
              <YAxis allowDecimals={false} />
              <Tooltip labelFormatter={(v) => new Date(v).toLocaleString('default', { month: 'long', year: 'numeric' })} />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Reuse MetricCard from customer analytics (you can extract to a shared component later)
function MetricCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
      <div className={`p-3 rounded-full ${bgColors[color]}`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}