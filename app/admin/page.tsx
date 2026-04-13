'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Stats {
  pendingSuppliers: number;
  pendingProducts: number;
  pendingPayments: number;
  totalOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/suppliers/pending'),
      api.get('/admin/products/pending'),
      api.get('/admin/orders/pending-payment'),
    ])
      .then(([suppliers, products, orders]) => {
        setStats({
          pendingSuppliers: suppliers.data.meta?.total || suppliers.data.length || 0,
          pendingProducts: products.data.meta?.total || products.data.length || 0,
          pendingPayments: orders.data.meta?.total || orders.data.length || 0,
          totalOrders: 0, // We'll add later
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Pending Suppliers" 
          value={stats?.pendingSuppliers || 0} 
          href="/admin/suppliers"
          color="blue"
        />
        <StatCard 
          title="Pending Products" 
          value={stats?.pendingProducts || 0} 
          href="/admin/products"
          color="green"
        />
        <StatCard 
          title="Pending Payments" 
          value={stats?.pendingPayments || 0} 
          href="/admin/payments"
          color="yellow"
        />
        <StatCard 
          title="Total Orders" 
          value={stats?.totalOrders || 0} 
          href="/admin/orders"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity 
          title="Recent Supplier Applications" 
          endpoint="/admin/suppliers/pending" 
          fields={['business_name', 'created_at']}
        />
        <RecentActivity 
          title="Products Awaiting Approval" 
          endpoint="/admin/products/pending" 
          fields={['title', 'created_at']}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, href, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  
  return (
    <Link href={href} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className={`text-3xl font-bold ${colorClasses[color].split(' ')[1]}`}>{value}</p>
    </Link>
  );
}

function RecentActivity({ title, endpoint, fields }: any) {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    api.get(endpoint).then(res => {
      setItems(res.data.data || res.data.slice(0, 5));
    });
  }, [endpoint]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="font-semibold mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-gray-500">No pending items</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((item: any) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span>{item[fields[0]] || item.user?.name}</span>
              <span className="text-gray-500">
                {new Date(item[fields[1]]).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}