'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

interface Order {
  id: number;
  order_number: string;
  total_amount: string | number;
  status: string;
  payment_status: string;
  created_at: string;
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const token = localStorage.getItem('auth_token');
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

  if (!hydrated || loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-lg">
          <p className="text-gray-500">You haven't placed any orders yet.</p>
          <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm md:text-base">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 md:p-4 whitespace-nowrap">Order #</th>
                <th className="text-left p-3 md:p-4 whitespace-nowrap">Date</th>
                <th className="text-left p-3 md:p-4 whitespace-nowrap">Total</th>
                <th className="text-left p-3 md:p-4 whitespace-nowrap">Status</th>
                <th className="text-left p-3 md:p-4 whitespace-nowrap">Payment</th>
                <th className="text-left p-3 md:p-4"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 md:p-4 font-mono text-sm">{order.order_number}</td>
                  <td className="p-3 md:p-4 whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 md:p-4">
                    $
                    {typeof order.total_amount === 'string'
                      ? parseFloat(order.total_amount).toFixed(2)
                      : order.total_amount.toFixed(2)}
                  </td>
                  <td className="p-3 md:p-4 whitespace-nowrap">
                    <span className="capitalize">{order.status.replace('_', ' ')}</span>
                  </td>
                  <td className="p-3 md:p-4 whitespace-nowrap">
                    <span className="capitalize">{order.payment_status.replace('_', ' ')}</span>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}