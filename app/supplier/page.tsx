'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

export default function SupplierDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingOrders: 0,
    activeProducts: 0,   // ✅ new field
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/supplier/products'),
      api.get('/supplier/orders?status=pending'),
    ])
      .then(([productsRes, ordersRes]) => {
        const productsData = productsRes.data.data || productsRes.data || [];
        const ordersData = ordersRes.data.data || ordersRes.data || [];

        setStats({
          totalProducts: productsData.length,
          pendingOrders: ordersData.length,
          activeProducts: productsData.filter((p: any) => p.status === 'active').length,
        });
        setRecentOrders(ordersData.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome back!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">Total Products</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">Pending Orders</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">Active Products</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeProducts}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-4">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="text-gray-500">No orders yet</p>
          ) : (
            <table className="w-full">
              <thead className="text-left text-sm text-gray-500">
                <tr>
                  <th className="pb-2">Order #</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-t">
                    <td className="py-2">{order.order_number}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2">${order.total_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/supplier/products" className="block p-3 border rounded hover:bg-gray-50">
              ➕ Add New Product
            </Link>
            <Link href="/supplier/orders" className="block p-3 border rounded hover:bg-gray-50">
              📦 View Orders to Fulfill
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}