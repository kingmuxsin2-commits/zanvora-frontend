'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DollarSign, Package, TrendingUp } from 'lucide-react';

interface EarningsData {
  total_sales: number;
  monthly_sales: Array<{ month: string; total: number }>;
  recent_orders: Array<{
    id: number;
    order_number: string;
    created_at: string;
    customer: { name: string };
    items: Array<{
      id: number;
      product: { title: string };
      quantity: number;
    }>;
    total: number;
  }>;
}

export default function SupplierEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/supplier/earnings')
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Earnings</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full"><DollarSign className="text-green-600" size={24} /></div>
            <div>
              <p className="text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold">${data.total_sales.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full"><Package className="text-blue-600" size={24} /></div>
            <div>
              <p className="text-gray-500">Orders Fulfilled</p>
              <p className="text-2xl font-bold">{data.recent_orders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full"><TrendingUp className="text-purple-600" size={24} /></div>
            <div>
              <p className="text-gray-500">This Month</p>
              <p className="text-2xl font-bold">
                ${data.monthly_sales[0]?.total.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Monthly Sales (Last 12 Months)</h2>
        <div className="flex items-end gap-2 h-48">
          {data.monthly_sales.slice().reverse().map((m, idx) => {
            const maxTotal = Math.max(...data.monthly_sales.map(m => m.total), 1);
            const height = (m.total / maxTotal) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-indigo-200 rounded-t" style={{ height: `${height}%`, minHeight: '4px' }}>
                  <div className="w-full h-full bg-indigo-600 rounded-t opacity-80"></div>
                </div>
                <span className="text-xs mt-1 whitespace-nowrap">{new Date(m.month).toLocaleString('default', { month: 'short' })}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <h2 className="text-xl font-semibold p-4 border-b">Recent Paid Orders</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">Order #</th>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Items</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_orders.map(order => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-mono">{order.order_number}</td>
                <td className="p-4">{order.customer.name}</td>
                <td className="p-4">
                  {order.items.map((item, idx) => (
                    <div key={item.id}>
                      {item.product.title} x {item.quantity}
                      {idx < order.items.length - 1 && <br />}
                    </div>
                  ))}
                </td>
                <td className="p-4">${order.total.toFixed(2)}</td>
                <td className="p-4 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}