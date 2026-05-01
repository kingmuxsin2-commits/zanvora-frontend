'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Eye, Search } from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  total_amount: string | number;
  status: string;
  payment_status: string;
  created_at: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    id: number;
    product: { title: string };
    quantity: number;
    unit_price: string | number;
  }>;
  fulfillments?: Array<{
    id: number;
    status: string;
    tracking_number: string | null;
    carrier: string | null;
    supplier: { business_name: string };
  }>;
  shipping_address?: {
    name?: string;
    phone?: string;
    address?: string;
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const statuses = ['all', 'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

  const fetchOrders = () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.append('status', filter);
    if (search) params.append('search', search);

    api.get(`/admin/orders?${params}`)
      .then(res => {
        const data = res.data.data || res.data || [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [filter, search]);

  const fetchOrderDetails = async (orderId: number) => {
    setModalLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch {
      alert('Failed to load order details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleMarkDelivered = async (fulfillmentId: number) => {
    if (!confirm('Mark this fulfillment as delivered?')) return;
    try {
      await api.post(`/admin/fulfillments/${fulfillmentId}/deliver`);
      if (selectedOrder) {
        await fetchOrderDetails(selectedOrder.id);
      }
    } catch {
      alert('Failed to mark as delivered');
    }
  };

  const openModal = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
    fetchOrderDetails(order.id);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by order # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-64"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">Order #</th>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Payment</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-mono">{o.order_number}</td>
                <td className="p-4">
                  {o.customer.name}<br />
                  <span className="text-gray-500 text-xs">{o.customer.email}</span>
                </td>
                <td className="p-4 font-medium">${Number(o.total_amount).toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    o.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    o.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {o.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    o.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    o.payment_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {o.payment_status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <button
                    onClick={() => openModal(o)}
                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {modalLoading || !selectedOrder ? (
              <div className="text-center py-8">Loading order details...</div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Order #{selectedOrder.order_number}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Customer</h3>
                    <p>{selectedOrder.customer.name}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.customer.email} • {selectedOrder.customer.phone}</p>
                  </div>

                  {/* Shipping Address */}
                  {selectedOrder.shipping_address && (
                    <div>
                      <h3 className="font-medium">Shipping Address</h3>
                      <p>{selectedOrder.shipping_address.name}</p>
                      <p>{selectedOrder.shipping_address.phone}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.shipping_address.address}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium">Items</h3>
                    <ul className="divide-y">
                      {selectedOrder.items.map(item => (
                        <li key={item.id} className="py-2 flex justify-between">
                          <span>{item.product.title} x {item.quantity}</span>
                          <span>${Number(item.unit_price).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>${Number(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Status:</span> {selectedOrder.status}</div>
                    <div><span className="font-medium">Payment:</span> {selectedOrder.payment_status}</div>
                    <div><span className="font-medium">Placed:</span> {new Date(selectedOrder.created_at).toLocaleString()}</div>
                  </div>

                  {/* Fulfillments Section */}
                  {selectedOrder.fulfillments && selectedOrder.fulfillments.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">Fulfillments</h3>
                      <div className="space-y-2">
                        {selectedOrder.fulfillments.map(f => (
                          <div key={f.id} className="border p-3 rounded flex items-center justify-between">
                            <div>
                              <p className="font-medium">{f.supplier?.business_name || 'Unknown Supplier'}</p>
                              <p className="text-sm text-gray-600">
                                Status: <span className="capitalize">{f.status}</span>
                                {f.tracking_number && (
                                  <> · Tracking: {f.tracking_number} ({f.carrier})</>
                                )}
                              </p>
                            </div>
                            {f.status === 'shipped' && (
                              <button
                                onClick={() => handleMarkDelivered(f.id)}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                              >
                                Mark Delivered
                              </button>
                            )}
                            {f.status === 'delivered' && (
                              <span className="text-green-600 text-sm">✓ Delivered</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => setShowModal(false)} className="mt-4 px-4 py-2 bg-gray-100 rounded w-full">
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}