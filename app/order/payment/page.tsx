'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import api from '@/lib/api';

interface Order {
  id: number;
  order_number: string;
  total_amount: string | number;
  payment_reference: string;
  payment_status: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const { clearCart } = useCartStore();

  useEffect(() => {
    setHydrated(true);
  }, []);

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

    if (!orderId) {
      router.push('/');
      return;
    }

    api.get(`/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res: { data: Order }) => {
        setOrder(res.data);
        clearCart();   // ✅ Clean the cart immediately after order is fetched
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [orderId, router, hydrated, clearCart]);

  const handleClaimPayment = async () => {
    if (!order) return;
    setClaiming(true);
    try {
      await api.post(`/orders/${order.id}/claim-payment`);
      setClaimed(true);
    } catch (error) {
      alert('Failed to notify. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!hydrated || loading) {
    return <div className="p-8 text-center">Loading…</div>;
  }

  if (!order) {
    return <div className="p-8 text-center">Order not found</div>;
  }

  const amount = typeof order.total_amount === 'string'
    ? parseFloat(order.total_amount)
    : order.total_amount;
  const roundedAmount = Math.round(amount);
  const ussdCode = `*220*0634702443*${roundedAmount}#`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold">Order Placed!</h1>
          <p className="text-gray-600">Order #{order.order_number}</p>
          <p className="text-sm text-gray-500 mt-2">
            Amount: SLSH {roundedAmount.toLocaleString('en-US')}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="font-semibold mb-3">📱 Pay with Mobile Money</h2>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">gali numberkan mobilka:</p>
            <div className="bg-black text-white p-3 rounded-lg font-mono text-lg text-center">
              {ussdCode}
            </div>
            <button
              onClick={() => copyToClipboard(ussdCode, 'code')}
              className="text-indigo-600 text-sm mt-2 hover:underline"
            >
              {copied === 'code' ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Reference (IMPORTANT):</p>
            <div className="bg-gray-100 p-3 rounded-lg font-mono text-center">
              {order.payment_reference}
            </div>
            <button
              onClick={() => copyToClipboard(order.payment_reference, 'ref')}
              className="text-indigo-600 text-sm mt-2 hover:underline"
            >
              {copied === 'ref' ? '✓ Copied!' : 'Copy Reference'}
            </button>
          </div>
        </div>

        {!claimed ? (
          <button
            onClick={handleClaimPayment}
            disabled={claiming}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 mb-4"
          >
            {claiming ? 'Notifying...' : 'Waan Soo Diray'}
          </button>
        ) : (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4 text-center">
            <p className="text-green-800">
              ✅ mahadsanid! yara sug inta la xaqiijinayo
            </p>
          </div>
        )}

        <button
          onClick={() => router.push(`/order/status?orderId=${order.id}`)}
          className="w-full text-indigo-600 hover:underline text-sm"
        >
          View Order Status
        </button>
      </div>
    </div>
  );
}