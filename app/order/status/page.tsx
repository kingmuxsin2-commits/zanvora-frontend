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
  delivery_confirmed_at: string | null;
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
  
  const [confirming, setConfirming] = useState(false);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    // 🔐 Robust token retrieval – identical to payment page
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

    if (!orderId) {
      router.push('/');
      return;
    }

    api.get(`/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res: { data: OrderStatus }) => {
        setOrder(res.data);
        setDeliveryConfirmed(!!res.data.delivery_confirmed_at);
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [orderId, router, hydrated]);

  const handleConfirmDelivery = async () => {
    if (!order) return;
    setConfirming(true);
    try {
      await api.post(`/orders/${order.id}/confirm-delivery`);
      setDeliveryConfirmed(true);
      setOrder({ ...order, delivery_confirmed_at: new Date().toISOString() });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setConfirming(false);
    }
  };

  if (!hydrated || loading) return <div className="p-8 text-center">Loading...</div>;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  const currentStepIndex = statusSteps.findIndex(s =>
    s.key === order.status ||
    (order.status === 'partial_shipped' && s.key === 'shipped')
  );
  const isDelivered = order.status === 'delivered';

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Order #{order.order_number}</h1>
      <p className="text-gray-600 mb-6">
        Placed on {new Date(order.created_at).toLocaleDateString()}
      </p>

      {/* Horizontal Timeline (Desktop only) */}
      <div className="hidden md:block mb-8">
        <div className="relative flex justify-between">
          {statusSteps.map((step, idx) => {
            const isCompleted = isDelivered ? true : idx <= currentStepIndex;
            return (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {idx < currentStepIndex || isDelivered ? '✓' : idx + 1}
                </div>
                <span className="text-xs mt-1 text-center">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vertical List (Mobile only) */}
      <div className="md:hidden mb-6 bg-gray-50 rounded-lg p-4">
        <h2 className="font-semibold mb-3">Order Progress</h2>
        <ol className="space-y-2">
          {statusSteps.map((step, idx) => {
            const isCompleted = isDelivered ? true : idx < currentStepIndex;
            const isCurrent = isDelivered ? false : idx === currentStepIndex;
            return (
              <li key={step.key} className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                    isCompleted
                      ? 'bg-indigo-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span
                  className={`${
                    isCurrent ? 'font-medium text-indigo-700' : 'text-gray-600'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Payment Status */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">Payment Status</h2>
        {order.payment_status === 'pending_manual' && (
          <div className="text-yellow-600">
            {order.admin_checking_at
              ? '⏳ Admin is checking your payment now.'
              : "⏳ Macmiil yara sug inta la checking gareenayo dalbka"}
            {!order.admin_checking_at && (
              <a
                href={`/order/payment?orderId=${order.id}`}
                className="ml-4 text-indigo-600 hover:underline"
              >
                Go to Payment Page
              </a>
            )}
          </div>
        )}
        {order.payment_status === 'paid' && !isDelivered && (
          <div className="text-green-600">
            ✅ Confirmed on{' '}
            {order.payment_confirmed_at
              ? new Date(order.payment_confirmed_at).toLocaleString()
              : '—'}
          </div>
        )}
        {order.payment_status === 'paid' && isDelivered && (
          <div className="text-green-600">✅ Order delivered</div>
        )}
        {order.payment_status === 'cancelled' && (
          <div className="text-red-600">❌ Order cancelled</div>
        )}
      </div>

      {/* Delivery Confirmation */}
      {isDelivered && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="font-semibold mb-2">Delivery Confirmation</h2>
          {deliveryConfirmed || order.delivery_confirmed_at ? (
            <div className="text-green-600">
              ✅ You confirmed delivery on{' '}
              {order.delivery_confirmed_at
                ? new Date(order.delivery_confirmed_at).toLocaleString()
                : '—'}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-3">Has your order arrived? Let us know!</p>
              <button
                onClick={handleConfirmDelivery}
                disabled={confirming}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {confirming ? 'Confirming...' : 'Confirm Delivery'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Shipments */}
      <div className="space-y-4">
        <h2 className="font-semibold">Shipments</h2>
        {order.fulfillments.map(f => (
          <div key={f.id} className="border p-4 rounded">
            {/* Supplier name removed */}
            <p className="text-sm text-gray-600">
              Status: <span className="capitalize">{f.status.replace('_', ' ')}</span>
            </p>
            {f.status === 'shipped' && f.tracking_number && (
              <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
                <p className="font-medium">📦 Tracking Information</p>
                <p>Carrier: {f.carrier}</p>
                <p>
                  Tracking Number:{' '}
                  <span className="font-mono">{f.tracking_number}</span>
                </p>
                {f.carrier === 'UPS' && (
                  <a
                    href={`https://www.ups.com/track?tracknum=${f.tracking_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-xs"
                  >
                    Track on UPS →
                  </a>
                )}
                {f.carrier === 'FedEx' && (
                  <a
                    href={`https://www.fedex.com/fedextrack/?trknbr=${f.tracking_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-xs"
                  >
                    Track on FedEx →
                  </a>
                )}
                {f.carrier === 'USPS' && (
                  <a
                    href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${f.tracking_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-xs"
                  >
                    Track on USPS →
                  </a>
                )}
                {f.carrier === 'DHL' && (
                  <a
                    href={`https://www.dhl.com/en/express/tracking.html?AWB=${f.tracking_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-xs"
                  >
                    Track on DHL →
                  </a>
                )}
              </div>
            )}
            {f.status === 'delivered' && (
              <div className="mt-2 p-3 bg-green-50 rounded text-sm text-green-700">
                ✓ Delivered
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}