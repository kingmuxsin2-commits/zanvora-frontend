'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Order {
  id: number;
  order_number: string;
  total_amount: string | number;
  payment_reference: string;
  payment_reference_override: string | null; // new field
  payment_status: string;
  payment_claimed_at: string | null;
  admin_checking_at: string | null;
  created_at: string;
  customer: {
    name: string;
    phone: string;
  };
}

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [overrideReference, setOverrideReference] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchOrders = () => {
    api.get('/admin/orders/pending-payment')
      .then(res => {
        const data = res.data.data || res.data || [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleMarkChecking = async (orderId: number) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, admin_checking_at: new Date().toISOString() }
          : order
      )
    );
    
    try {
      await api.post(`/admin/orders/${orderId}/mark-checking`);
    } catch (error) {
      fetchOrders();
    }
  };

  const handleConfirm = async (orderId: number) => {
    setProcessing(orderId);
    try {
      await api.post(`/admin/orders/${orderId}/confirm-payment`);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error('Failed to confirm payment:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (orderId: number) => {
    setProcessing(orderId);
    try {
      await api.post(`/admin/orders/${orderId}/reject-payment`);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error('Failed to reject order:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleSaveReference = async (orderId: number) => {
    if (!overrideReference.trim()) return;
    setSaving(true);
    try {
      await api.post(`/admin/orders/${orderId}/payment-reference`, {
        payment_reference_override: overrideReference,
      });
      fetchOrders();
      setEditingOrderId(null);
      setOverrideReference('');
    } catch {
      alert('Failed to save reference');
    } finally {
      setSaving(false);
    }
  };

  const copyAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    navigator.clipboard?.writeText(num.toFixed(2));
  };

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(2);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pending Payment Verification</h1>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-lg">
          <p className="text-gray-500">No pending payments</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4">Order #</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Reference</th>
                <th className="text-left p-4">Claimed</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-mono text-sm">{order.order_number}</td>
                  <td className="p-4">
                    {order.customer.name}
                    <br />
                    <span className="text-sm text-gray-500">{order.customer.phone}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold">${formatAmount(order.total_amount)}</span>
                    <button
                      onClick={() => copyAmount(order.total_amount)}
                      className="ml-2 text-indigo-600 text-sm hover:underline"
                    >
                      📋 Copy
                    </button>
                  </td>
                  <td className="p-4 font-mono text-sm">
                    {editingOrderId === order.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={overrideReference}
                          onChange={(e) => setOverrideReference(e.target.value)}
                          className="w-32 px-2 py-1 border rounded text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveReference(order.id);
                            if (e.key === 'Escape') setEditingOrderId(null);
                          }}
                          disabled={saving}
                        />
                        <button
                          onClick={() => handleSaveReference(order.id)}
                          disabled={saving}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingOrderId(null)}
                          className="text-gray-500 hover:underline text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{order.payment_reference_override || order.payment_reference}</span>
                        <button
                          onClick={() => {
                            setEditingOrderId(order.id);
                            setOverrideReference(order.payment_reference_override || order.payment_reference);
                          }}
                          className="text-indigo-600 hover:underline text-xs"
                          title="Edit reference"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {order.payment_claimed_at ? (
                      <span className="text-green-600">✓ {new Date(order.payment_claimed_at).toLocaleTimeString()}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {!order.admin_checking_at && (
                        <button
                          onClick={() => handleMarkChecking(order.id)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                        >
                          I'm Checking
                        </button>
                      )}
                      <button
                        onClick={() => handleConfirm(order.id)}
                        disabled={processing === order.id}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleReject(order.id)}
                        disabled={processing === order.id}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
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