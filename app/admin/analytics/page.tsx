'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Users, ShoppingBag, TrendingUp, Repeat, Calendar, UserCheck,
  Package, CheckCircle, Clock, AlertCircle, DollarSign, Layers
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ---------- Interfaces ----------
interface CustomerAnalyticsData {
  user_stats: { total_customers: number; total_suppliers: number; total_admins: number };
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

interface RfmData {
  segments: Record<string, number>;
  top_vip: Array<{ customer_id: number; recency: number; frequency: number; monetary: number; rfm_score: string }>;
}

interface LtvData {
  buckets: Record<string, number>;
  average_ltv: number;
  total_customers_with_purchases: number;
}

interface SupplierCohortData {
  cohort: string;
  size: number;
  retention: Record<number, number>;
}

interface ArpsData {
  month: string;
  arps: number;
}

interface ConcentrationData {
  top_20_count: number;
  top_20_revenue_share: number;
  total_suppliers_with_revenue: number;
}

interface ChurnData {
  churned: number;
  active: number;
  total: number;
  churn_rate: number;
}

// ---------- Main Page ----------
export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers' | 'products'>('customers');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2 border-b">
          <TabButton active={activeTab === 'customers'} onClick={() => setActiveTab('customers')}>
            Customers
          </TabButton>
          <TabButton active={activeTab === 'suppliers'} onClick={() => setActiveTab('suppliers')}>
            Suppliers
          </TabButton>
          <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')}>
            Products
          </TabButton>
        </div>
      </div>

      {activeTab === 'customers' && <CustomerAnalytics />}
      {activeTab === 'suppliers' && <SupplierAnalytics />}
      {activeTab === 'products' && <ProductAnalytics />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-colors ${
        active ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

// ---------- Customer Analytics (Enhanced with RFM + LTV) ----------
function CustomerAnalytics() {
  const [data, setData] = useState<CustomerAnalyticsData | null>(null);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [rfmData, setRfmData] = useState<RfmData | null>(null);
  const [ltvData, setLtvData] = useState<LtvData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics'),
      api.get('/admin/analytics/cohort-retention'),
      api.get('/admin/analytics/rfm'),
      api.get('/admin/analytics/ltv-distribution')
    ])
      .then(([res1, res2, res3, res4]) => {
        setData(res1.data);
        setCohortData(res2.data);
        setRfmData(res3.data);
        setLtvData(res4.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading customer analytics...</div>;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Customers" value={data.user_stats.total_customers} icon={<Users className="text-blue-600" size={24} />} color="blue" />
        <MetricCard title="Total Suppliers" value={data.user_stats.total_suppliers} icon={<ShoppingBag className="text-green-600" size={24} />} color="green" />
        <MetricCard title="Conversion Rate" value={`${data.conversion_rate}%`} subtitle={`${data.paid_orders} paid orders`} icon={<TrendingUp className="text-purple-600" size={24} />} color="purple" />
        <MetricCard title="Repeat Customer Rate" value={`${data.repeat_rate}%`} subtitle="Customers with >1 order" icon={<Repeat className="text-orange-600" size={24} />} color="orange" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard title="Avg. Customer Lifetime" value={`${data.avg_lifetime_days} days`} subtitle="First to last paid order" icon={<Calendar className="text-indigo-600" size={24} />} color="indigo" />
        <MetricCard title="Returning Customers (30d)" value={data.returning_customers_30d} subtitle="Ordered before & in last 30d" icon={<UserCheck className="text-teal-600" size={24} />} color="teal" />
      </div>

      {/* RFM Segmentation */}
      {rfmData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">RFM Segmentation</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(rfmData.segments).map(([segment, count]) => (
              <div key={segment} className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-gray-500">{segment}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            VIP: high recency, frequency, monetary. At Risk: low recency, high frequency. Lost: low recency, low frequency.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Recency: days since last order (higher = more recent). Frequency: total paid orders. Monetary: total spent.
          </p>
        </div>
      )}

      {/* LTV Distribution */}
      {ltvData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Customer Lifetime Value Distribution</h2>
          <p className="text-sm text-gray-500 mb-2">
            Average LTV: ${ltvData.average_ltv} (based on {ltvData.total_customers_with_purchases} customers)
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(ltvData.buckets).map(([range, count]) => ({ range, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
        {cohortData.length === 0 ? (
          <p className="text-gray-500">No cohort data available yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Cohort</th>
                <th className="text-left p-2">Size</th>
                {Array.from({ length: 7 }, (_, i) => <th key={i} className="text-center p-2">Month {i}</th>)}
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
                      <td key={i} className="text-center p-2" style={{ backgroundColor: value ? `rgba(79, 70, 229, ${bgOpacity * 0.3})` : 'transparent', color: value && value > 50 ? 'white' : 'inherit' }}>
                        {value !== undefined ? `${value}%` : '–'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-gray-400 mt-2">Each cell shows the percentage of customers from that cohort who placed a paid order in the given month after signup.</p>
      </div>
    </div>
  );
}

// ---------- Supplier Analytics (Enhanced with ARPS, Cohort, Concentration, Churn) ----------
function SupplierAnalytics() {
  const [data, setData] = useState<SupplierAnalyticsData | null>(null);
  const [cohortData, setCohortData] = useState<SupplierCohortData[]>([]);
  const [arpsData, setArpsData] = useState<ArpsData[]>([]);
  const [concentrationData, setConcentrationData] = useState<ConcentrationData | null>(null);
  const [churnData, setChurnData] = useState<ChurnData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics/suppliers'),
      api.get('/admin/analytics/suppliers/cohort'),
      api.get('/admin/analytics/suppliers/arps'),
      api.get('/admin/analytics/suppliers/concentration'),
      api.get('/admin/analytics/suppliers/churn')
    ])
      .then(([res1, res2, res3, res4, res5]) => {
        setData(res1.data);
        setCohortData(res2.data);
        setArpsData(res3.data);
        setConcentrationData(res4.data);
        setChurnData(res5.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading supplier analytics...</div>;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  const bucketData = Object.entries(data.product_buckets).map(([range, count]) => ({ range, count }));

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Total Products Listed" value={data.total_products} icon={<Package className="text-blue-600" size={24} />} color="blue" />
        <MetricCard title="Active Suppliers" value={data.total_approved_suppliers} icon={<Users className="text-green-600" size={24} />} color="green" />
        <MetricCard title="Avg Products/Supplier" value={data.top_listers.length > 0 ? Math.round(data.total_products / data.top_listers.length) : 0} icon={<Layers className="text-purple-600" size={24} />} color="purple" />
      </div>

      {/* ARPS Trend */}
      {arpsData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Average Revenue per Supplier (Last 12 Months)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={arpsData.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={(v) => new Date(v).toLocaleString('default', { month: 'short' })} />
                <YAxis />
                <Tooltip formatter={(v) => `$${v}`} labelFormatter={(v) => new Date(v).toLocaleString('default', { month: 'long', year: 'numeric' })} />
                <Line type="monotone" dataKey="arps" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Sellers & Listers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><TrendingUp className="text-indigo-600" size={20} /> Top Sellers (by Revenue)</h2>
          <div className="space-y-3">
            {data.top_sellers.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-gray-400 text-sm w-5">{idx + 1}.</span><span className="font-medium">{s.business_name}</span></div>
                <span className="font-bold">${Number(s.total_revenue).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Package className="text-indigo-600" size={20} /> Most Active Listers (by Product Count)</h2>
          <div className="space-y-3">
            {data.top_listers.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-gray-400 text-sm w-5">{idx + 1}.</span><span className="font-medium">{s.business_name}</span></div>
                <span className="font-bold">{s.product_count} products</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Concentration & Churn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {concentrationData && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Revenue Concentration</h2>
            <p className="text-3xl font-bold text-indigo-600">{concentrationData.top_20_revenue_share}%</p>
            <p className="text-gray-500">of total revenue comes from the top {concentrationData.top_20_count} suppliers</p>
            <p className="text-xs text-gray-400 mt-2">(out of {concentrationData.total_suppliers_with_revenue} suppliers with sales)</p>
          </div>
        )}
        {churnData && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Supplier Churn (90d inactivity)</h2>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-red-600">{churnData.churn_rate}%</p>
              <p className="text-gray-500">churn rate</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">{churnData.churned} churned / {churnData.total} total approved suppliers</p>
          </div>
        )}
      </div>

      {/* Supplier Cohort Retention */}
      <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Supplier Retention (by Approval Month)</h2>
        {cohortData.length === 0 ? (
          <p className="text-gray-500">No cohort data available yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Cohort</th>
                <th className="text-left p-2">Size</th>
                {Array.from({ length: 7 }, (_, i) => <th key={i} className="text-center p-2">Month {i}</th>)}
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
                      <td key={i} className="text-center p-2" style={{ backgroundColor: value ? `rgba(79, 70, 229, ${bgOpacity * 0.3})` : 'transparent', color: value && value > 50 ? 'white' : 'inherit' }}>
                        {value !== undefined ? `${value}%` : '–'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-gray-400 mt-2">Percentage of suppliers who listed at least one product in the given month after approval.</p>
      </div>

      {/* Products per Supplier Distribution */}
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

      {/* Monthly New Products */}
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

// ---------- Product Analytics ----------
function ProductAnalytics() {
  const [data, setData] = useState<ProductAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics/products')
      .then(res => setData(res.data))
      .catch(console.error)
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Products" value={data.total_products} icon={<Package className="text-blue-600" size={24} />} color="blue" />
        <MetricCard title="Active Products" value={data.status_counts?.active || 0} icon={<CheckCircle className="text-green-600" size={24} />} color="green" />
        <MetricCard title="Pending Review" value={data.status_counts?.pending_review || 0} icon={<Clock className="text-yellow-600" size={24} />} color="yellow" />
        <MetricCard title="Unsold Products" value={data.unsold_count} subtitle="Active with no sales" icon={<AlertCircle className="text-red-600" size={24} />} color="red" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard title="Avg. Sales Velocity" value={`${avgVelocity} units/day`} subtitle="Top 10 products average" icon={<TrendingUp className="text-purple-600" size={24} />} color="purple" />
        <MetricCard title="Total Revenue (Wholesale)" value={`$${totalRevenue}`} subtitle="Last 12 months" icon={<DollarSign className="text-indigo-600" size={24} />} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><TrendingUp className="text-indigo-600" size={20} /> Top Products by Quantity Sold</h2>
          <div className="space-y-3">
            {data.top_by_quantity.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-gray-400 text-sm w-5">{idx + 1}.</span><span className="font-medium truncate max-w-[180px]">{p.title}</span></div>
                <div className="text-right"><span className="font-bold">{p.total_quantity} units</span><span className="text-xs text-gray-400 block">{p.velocity} units/day</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><DollarSign className="text-indigo-600" size={20} /> Top Products by Revenue</h2>
          <div className="space-y-3">
            {data.top_by_revenue.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-gray-400 text-sm w-5">{idx + 1}.</span><span className="font-medium truncate max-w-[180px]">{p.title}</span></div>
                <span className="font-bold">${p.total_revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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

// ---------- Shared MetricCard ----------
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