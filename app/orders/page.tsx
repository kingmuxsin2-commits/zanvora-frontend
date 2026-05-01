'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  total_amount: string | number;
  status: string;
  payment_status: string;
  created_at: string;
  delivery_confirmed_at?: string | null;
}

const STATUS_GROUPS = [
  { key: 'pending_payment', label: 'Awaiting Payment', defaultOpen: true },
  { key: 'processing', label: 'Processing', defaultOpen: true },
  { key: 'shipped', label: 'Shipped', defaultOpen: true },
  { key: 'delivered', label: 'Delivered', defaultOpen: false },
  { key: 'cancelled', label: 'Cancelled', defaultOpen: false },
];

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    STATUS_GROUPS.forEach(g => { initial[g.key] = g.defaultOpen; });
    return initial;
  });

  useEffect(() => {
    setHydrated(true);
  }, []);

  // 🔐 Identical token retrieval that works on the payment page
  useEffect(() => {
    if (!hydrated) return;

    let token = window.localStorage.getItem('auth_token');
    if (!token) token = window.sessionStorage.getItem('auth_token');
    if (!token) {
      try {
        const raw = window.localStorage.getItem('auth-storage');
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.state?.token;
        }
      } catch {}
    }

    if (!token) {
      router.push('/login');
      return;
    }

    api.get('/my-orders')
      .then((res: { data: Order[] }) => setOrders(res.data))
      .catch((err) => {
        console.error('Failed to fetch orders:', err);
        setError('Could not load orders. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [hydrated, router]);

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!hydrated || loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const ordersByStatus: Record<string, Order[]> = {};
  STATUS_GROUPS.forEach(g => { ordersByStatus[g.key] = []; });
  orders.forEach(order => {
    if (ordersByStatus[order.status]) {
      ordersByStatus[order.status].push(order);
    }
  });

  const renderOrderRow = (order: Order) => {
    const numericAmount =
      typeof order.total_amount === 'string'
        ? parseFloat(order.total_amount)
        : order.total_amount;

    const formattedTotal = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(numericAmount);

    return (
      <tr key={order.id} className="border-b hover:bg-gray-50">
        <td className="p-3 md:p-4 font-mono text-sm">{order.order_number}</td>
        <td className="p-3 md:p-4 whitespace-nowrap">
          {new Date(order.created_at).toLocaleDateString()}
        </td>
        <td className="p-3 md:p-4">
          {formattedTotal} slsh
        </td>
        <td className="p-3 md:p-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs ${
              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status.replace('_', ' ')}
            </span>
            {order.status === 'delivered' && order.delivery_confirmed_at && (
              <span className="text-green-600 text-xs" title="Delivery confirmed by you">✓</span>
            )}
          </div>
        </td>
        <td className="p-3 md:p-4 whitespace-nowrap">
          <span className={`px-2 py-1 rounded-full text-xs ${
            order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
            order.payment_status === 'cancelled' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {order.payment_status.replace('_', ' ')}
          </span>
        </td>
        <td className="p-3 md:p-4">
          <Link
            href={`/order/status?orderId=${order.id}`}
            className="text-indigo-600 hover:underline whitespace-nowrap"
          >
            View Details
          </Link>
        </td>
      </tr>
    );
  };

  const totalOrders = orders.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">My Orders</h1>

      {totalOrders === 0 ? (
        <div className="bg-white p-8 text-center rounded-lg">
          <p className="text-gray-500">You haven't placed any orders yet.</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {STATUS_GROUPS.map(group => {
            const groupOrders = ordersByStatus[group.key] || [];
            if (groupOrders.length === 0) return null;
            const isOpen = openGroups[group.key];
            return (
              <div key={group.key} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
                    <span className="font-medium text-gray-800">{group.label}</span>
                    <span className="text-sm text-gray-500 ml-2">({groupOrders.length})</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm md:text-base">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 md:p-4">Order #</th>
                          <th className="text-left p-3 md:p-4">Date</th>
                          <th className="text-left p-3 md:p-4">Total</th>
                          <th className="text-left p-3 md:p-4">Status</th>
                          <th className="text-left p-3 md:p-4">Payment</th>
                          <th className="text-left p-3 md:p-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupOrders.map(renderOrderRow)}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}