'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Users, ShoppingBag, TrendingUp, Repeat, Calendar, UserCheck, 
  Package, Layers, BarChart2 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar 
} from 'recharts';

// ---------- Types ----------
interface AnalyticsData {
  user_stats: {
    total_customers: number;
    total_suppliers: number;
    total_admins: number;
  };
  signups: Array<{ date: string; count: number }>;
  orders: Array<{ date: string; count: number }>;
  repeat_rate: number;
  conversion_rate: number;
  total_orders: number;
  paid_orders: number;
  avg_lifetime_days: number;
  returning_customers_30d: number;
}

interface CohortData {
  cohort: string;
  size: number;
  retention: Record<number, number>;
}

interface SupplierAnalyticsData {
  total_approved_suppliers: number;
  total_products: number;
  top_sellers: Array<{ id: number; business_name: string; total_revenue: number }>;
  top_listers: Array<{ id: number; business_name: string; product_count: number }>;
  product_buckets: Record<string, number>;
  monthly_products: Array<{ month: string; count: number }>;
}

// ---------- Main Component ----------
export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');

  // Customer analytics state
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cohortLoading, setCohortLoading] = useState(true);

  // Supplier analytics state
  const [supplierData, setSupplierData] = useState<SupplierAnalyticsData | null>(null);
  const [supplierLoading, setSupplierLoading] = useState(true);

  // Fetch customer data
  useEffect(() => {
    setLoading(true);
    setCohortLoading(true);
    api.get('/admin/analytics')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    api.get('/admin/analytics/cohort-retention')
      .then(res => setCohortData(res.data))
      .catch(console.error)
      .finally(() => setCohortLoading(false));
  }, []);

  // Fetch supplier data when tab changes to suppliers
  useEffect(() => {
    if (activeTab === 'suppliers' && !supplierData) {
      setSupplierLoading(true);
      api.get('/admin/analytics/suppliers')
        .then(res => setSupplierData(res.data))
        .catch(console.error)
        .finally(() => setSupplierLoading(false));
    }
  }, [activeTab, supplierData]);

  if (loading && activeTab === 'customers') {
    return <div className="p-8 text-center">Loading customer analytics...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'customers'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Customer Analytics
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'suppliers'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Supplier Analytics
        </button>
      </div>

      {/* Customer Tab Content */}
      {activeTab === 'customers' && data && (
        <div className="space-y-8">
          {/* Key Metrics Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Customers"
              value={data.user_stats.total_customers}
              icon={<Users className="text-blue-600" size={24} />}
              color="blue"
            />
            <MetricCard
              title="Total Suppliers"
              value={data.user_stats.total_suppliers}
              icon={<ShoppingBag className="text-green-600" size={24} />}
              color="green"
            />
            <MetricCard
              title="Conversion Rate"
              value={`${data.conversion_rate}%`}
              subtitle={`${data.paid_orders} paid orders`}
              icon={<TrendingUp className="text-purple-600" size={24} />}
              color="purple"
            />
            <MetricCard
              title="Repeat Customer Rate"
              value={`${data.repeat_rate}%`}
              subtitle="Customers with >1 order"
              icon={<Repeat className="text-orange-600" size={24} />}
              color="orange"
            />
          </div>

          {/* Key Metrics Row 2 (Retention) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Avg. Customer Lifetime"
              value={`${data.avg_lifetime_days} days`}
              subtitle="First to last paid order"
              icon={<Calendar className="text-indigo-600" size={24} />}
              color="indigo"
            />
            <MetricCard
              title="Returning Customers (30d)"
              value={data.returning_customers_30d}
              subtitle="Ordered before & in last 30d"
              icon={<UserCheck className="text-teal-600" size={24} />}
              color="teal"
            />
          </div>

          {/* Signups Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">New Signups (Last 30 Days)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.signups}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Orders Placed (Last 30 Days)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.orders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cohort Retention Table */}
          <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Cohort Retention (by Signup Month)</h2>
            {cohortLoading ? (
              <p className="text-gray-500">Loading cohort data...</p>
            ) : cohortData.length === 0 ? (
              <p className="text-gray-500">No cohort data available yet.</p>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Cohort</th>
                      <th className="text-left p-2">Size</th>
                      {Array.from({ length: 7 }, (_, i) => (
                        <th key={i} className="text-center p-2">Month {i}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map((row) => (
                      <tr key={row.cohort} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{row.cohort}</td>
                        <td className="p-2">{row.size}</td>
                        {Array.from({ length: 7 }, (_, i) => {
                          const value = row.retention[i];
                          const bgOpacity = value ? value / 100 : 0;
                          return (
                            <td
                              key={i}
                              className="text-center p-2"
                              style={{
                                backgroundColor: value ? `rgba(79, 70, 229, ${bgOpacity * 0.3})` : 'transparent',
                                color: value && value > 50 ? 'white' : 'inherit',
                              }}
                            >
                              {value !== undefined ? `${value}%` : '–'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-2">
                  Each cell shows the percentage of customers from that cohort who placed a paid order in the given month after signup.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Supplier Tab Content */}
      {activeTab === 'suppliers' && (
        supplierLoading ? (
          <div className="p-8 text-center">Loading supplier analytics...</div>
        ) : supplierData ? (
          <SupplierAnalyticsView data={supplierData} />
        ) : (
          <div className="p-8 text-center">No supplier data available</div>
        )
      )}
    </div>
  );
}

// ---------- Supplier Analytics Sub-component ----------
function SupplierAnalyticsView({ data }: { data: SupplierAnalyticsData }) {
  const bucketData = Object.entries(data.product_buckets).map(([range, count]) => ({ range, count }));

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Products Listed"
          value={data.total_products}
          icon={<Package className="text-blue-600" size={24} />}
          color="blue"
        />
        <MetricCard
          title="Approved Suppliers"
          value={data.total_approved_suppliers}
          icon={<Users className="text-green-600" size={24} />}
          color="green"
        />
        <MetricCard
          title="Avg Products/Supplier"
          value={data.total_approved_suppliers > 0 
            ? Math.round(data.total_products / data.total_approved_suppliers) 
            : 0}
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
            {data.top_sellers.length === 0 ? (
              <p className="text-gray-500">No sales data yet.</p>
            ) : (
              data.top_sellers.map((s, idx) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm w-5">{idx + 1}.</span>
                    <span className="font-medium">{s.business_name}</span>
                  </div>
                  <span className="font-bold">${s.total_revenue.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="text-indigo-600" size={20} /> Most Active Listers (by Product Count)
          </h2>
          <div className="space-y-3">
            {data.top_listers.length === 0 ? (
              <p className="text-gray-500">No products listed yet.</p>
            ) : (
              data.top_listers.map((s, idx) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm w-5">{idx + 1}.</span>
                    <span className="font-medium">{s.business_name}</span>
                  </div>
                  <span className="font-bold">{s.product_count} products</span>
                </div>
              ))
            )}
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
              <XAxis 
                dataKey="month" 
                tickFormatter={(v) => new Date(v).toLocaleString('default', { month: 'short' })} 
              />
              <YAxis allowDecimals={false} />
              <Tooltip 
                labelFormatter={(v) => new Date(v).toLocaleString('default', { month: 'long', year: 'numeric' })} 
              />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---------- Shared Metric Card Component ----------
function MetricCard({ title, value, subtitle, icon, color }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'teal';
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
    indigo: 'bg-indigo-100',
    teal: 'bg-teal-100',
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