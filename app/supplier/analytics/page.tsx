'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DollarSign, Package, TrendingUp, Repeat, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Image from 'next/image';

interface SupplierAnalyticsData {
  summary: {
    total_sales: number;
    total_orders: number;
    total_products: number;
    active_products: number;
  };
  monthly_sales: Array<{ month: string; revenue: number; orders: number }>;
  top_products: Array<{
    id: number;
    title: string;
    image: string | null;
    total_quantity: number;
    total_revenue: number;
  }>;
  customer_repeat_rate: number;
  inventory: {
    low_stock: number;
    out_of_stock: number;
  };
}

export default function SupplierAnalyticsPage() {
  const [data, setData] = useState<SupplierAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/supplier/analytics')
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Store Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sales"
          value={`$${data.summary.total_sales.toFixed(2)}`}
          icon={<DollarSign className="text-green-600" size={24} />}
          color="green"
        />
        <MetricCard
          title="Total Orders"
          value={data.summary.total_orders}
          icon={<Package className="text-blue-600" size={24} />}
          color="blue"
        />
        <MetricCard
          title="Active Products"
          value={data.summary.active_products}
          subtitle={`of ${data.summary.total_products} total`}
          icon={<Package className="text-purple-600" size={24} />}
          color="purple"
        />
        <MetricCard
          title="Customer Repeat Rate"
          value={`${data.customer_repeat_rate}%`}
          icon={<Repeat className="text-orange-600" size={24} />}
          color="orange"
        />
      </div>

      {/* Inventory Alerts */}
      {(data.inventory.low_stock > 0 || data.inventory.out_of_stock > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-yellow-800">Inventory Alerts</p>
            <p className="text-sm text-yellow-700">
              {data.inventory.low_stock > 0 && `${data.inventory.low_stock} product(s) running low (≤5 units). `}
              {data.inventory.out_of_stock > 0 && `${data.inventory.out_of_stock} product(s) out of stock.`}
            </p>
          </div>
        </div>
      )}

      {/* Monthly Sales Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Monthly Sales (Last 12 Months)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly_sales.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={(v) => new Date(v).toLocaleString('default', { month: 'short' })} />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [name === 'revenue' ? `$${value}` : value, name]}
                labelFormatter={(v) => new Date(v).toLocaleString('default', { month: 'long', year: 'numeric' })}
              />
              <Bar dataKey="revenue" fill="#4F46E5" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Top Selling Products</h2>
        <div className="space-y-4">
          {data.top_products.map((product, idx) => (
            <div key={product.id} className="flex items-center gap-4 border-b pb-4 last:border-0">
              <span className="text-gray-400 w-5">{idx + 1}.</span>
              {product.image && (
                <img src={product.image} alt={product.title} className="w-12 h-12 object-cover rounded" />
              )}
              <div className="flex-1">
                <p className="font-medium">{product.title}</p>
                <p className="text-sm text-gray-500">
                  {product.total_quantity} sold · ${product.total_revenue.toFixed(2)} revenue
                </p>
              </div>
            </div>
          ))}
          {data.top_products.length === 0 && (
            <p className="text-gray-500">No sales data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, color }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-100', green: 'bg-green-100', purple: 'bg-purple-100', orange: 'bg-orange-100',
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