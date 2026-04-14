'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

interface Fulfillment {
  id: number;
  status: string;
  tracking_number: string | null;
  carrier: string | null;
  supplier: { business_name: string };
}

interface OrderStatus {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: string | number;
  created_at: string;
  payment_confirmed_at: string | null;
  admin_checking_at: string | null;
  fulfillments: Fulfillment[];
}

const statusSteps = [
  { key: 'pending_payment', label: 'Awaiting Payment' },
  { key: 'paid', label: 'Payment Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrderStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const token = window.localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (!orderId) {
      router.push('/');
      return;
    }

    api.get(`/orders/${orderId}`)
      .then((res: { data: OrderStatus }) => setOrder(res.data))
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [orderId, router, hydrated]);

  if (!hydrated || loading) return <div className="p-8 text-center">Loading...</div>;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  const currentStepIndex = statusSteps.findIndex(s => 
    s.key === order.status || 
    (order.status === 'partial_shipped' && s.key === 'shipped')
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Order #{order.order_number}</h1>
      <p className="text-gray-600 mb-6">
        Placed on {new Date(order.created_at).toLocaleDateString()}
      </p>
      
      <div className="mb-8">
        <div className="relative flex justify-between">
          {statusSteps.map((step, idx) => (
            <div key={step.key} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                idx <= currentStepIndex ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {idx < currentStepIndex ? '✓' : idx + 1}
              </div>
              <span className="text-xs mt-1 text-center">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">Payment Status</h2>
        {order.payment_status === 'pending_manual' && (
          <div className="text-yellow-600">
            {order.admin_checking_at 
              ? '⏳ Admin is checking your payment now.' 
              : "⏳ Awaiting verification. We'll check within 30 minutes."}
            {!order.admin_checking_at && (
              <a href={`/order/payment?orderId=${order.id}`} className="ml-4 text-indigo-600 hover:underline">
                Go to Payment Page
              </a>
            )}
          </div>
        )}
        {order.payment_status === 'paid' && (
          <div className="text-green-600">
            ✅ Confirmed on {order.payment_confirmed_at 
              ? new Date(order.payment_confirmed_at).toLocaleString() 
              : '—'}
          </div>
        )}
        {order.payment_status === 'cancelled' && (
          <div className="text-red-600">❌ Order cancelled</div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Shipments</h2>
        {order.fulfillments.map(f => (
          <div key={f.id} className="border p-4 rounded">
            <p className="font-medium">{f.supplier.business_name}</p>
            <p className="text-sm text-gray-600">Status: {f.status}</p>
            {f.tracking_number && (
              <p className="text-sm">
                Tracking: {f.tracking_number} ({f.carrier})
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}