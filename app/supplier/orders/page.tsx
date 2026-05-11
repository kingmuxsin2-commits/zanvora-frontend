'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface OrderItem {
  id: number;
  product: { title: string };
  quantity: number;
}

interface Fulfillment {
  id: number;
  status: string;
  tracking_number: string | null;
  carrier: string | null;
  order: {
    id: number;
    order_number: string;
    customer: { name: string; phone: string };
    shipping_address: { name: string; phone: string; address: string };
    items: OrderItem[];
  };
}

export default function SupplierOrdersPage() {
  const router = useRouter();
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [selectedFulfillment, setSelectedFulfillment] = useState<Fulfillment | null>(null);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkAction, setIsBulkAction] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  const fetchOrders = () => {
    api.get('/supplier/orders')
      .then((res: { data: Fulfillment[] }) => setFulfillments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

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

    fetchOrders();
  }, [hydrated, router]);

  // Single order handler
  const handleMarkShipped = (fulfillment: Fulfillment) => {
    setSelectedFulfillment(fulfillment);
    setCarrier('');
    setTrackingNumber('');
    setIsBulkAction(false);
    setShowModal(true);
  };

  // Bulk handler
  const handleBulkMarkShipped = () => {
    if (selectedIds.size === 0) return;
    setSelectedFulfillment(null);   // no single order for bulk
    setCarrier('');
    setTrackingNumber('');
    setIsBulkAction(true);
    setShowModal(true);
  };

  // Single shipment – now with user‑friendly error message
  const handleSubmitShipment = async () => {
    if (!selectedFulfillment) return;
    if (!carrier || !trackingNumber) {
      alert('Please enter both carrier and tracking number');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/supplier/fulfillments/${selectedFulfillment.id}`, {
        carrier,
        tracking_number: trackingNumber,
      });

      fetchOrders();
      setShowModal(false);
      setSelectedFulfillment(null);
    } catch (error: any) {
      // if backend returns an error (e.g. already shipped before our fix), show a clearer message
      const msg = error?.response?.data?.message || 'Failed to mark as shipped. Please try again.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk shipment – partial success/failure reporting
  const handleBulkSubmitShipment = async () => {
    if (selectedIds.size === 0) return;
    if (!carrier || !trackingNumber) {
      alert('Please enter both carrier and tracking number');
      return;
    }

    setIsSubmitting(true);
    const ids = Array.from(selectedIds);
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await api.put(`/supplier/fulfillments/${id}`, {
          carrier,
          tracking_number: trackingNumber,
        });
        success++;
      } catch {
        failed++;
      }
    }

    fetchOrders();
    setSelectedIds(new Set());
    setShowModal(false);

    if (failed === 0) {
      // All succeeded – no alert needed (list already updated)
    } else if (success === 0) {
      alert('None of the selected orders could be marked as shipped. They may have already been processed.');
    } else {
      alert(`${success} order(s) marked as shipped. ${failed} order(s) failed (may already be shipped).`);
    }

    setIsSubmitting(false);
  };

  // Toggle checkbox
  const toggleCheckbox = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle all
  const toggleAll = () => {
    if (selectedIds.size === fulfillments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(fulfillments.map(f => f.id)));
    }
  };

  if (!hydrated || loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">Orders to Fulfill</h1>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkMarkShipped}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
          >
            Bulk Mark as Shipped ({selectedIds.size})
          </button>
        )}
      </div>

      {fulfillments.length === 0 ? (
        <div className="bg-white p-6 md:p-8 text-center rounded-lg">
          <p className="text-gray-500">No pending orders to fulfill.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 md:p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === fulfillments.length && fulfillments.length > 0}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left p-3 md:p-4">Order #</th>
                <th className="text-left p-3 md:p-4">Items</th>
                <th className="text-left p-3 md:p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fulfillments.map(f => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 md:p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(f.id)}
                      onChange={() => toggleCheckbox(f.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-3 md:p-4 font-mono">{f.order.order_number}</td>
                  <td className="p-3 md:p-4">
                    {f.order.items.map(item => (
                      <div key={item.id}>
                        {item.product.title} x {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="p-3 md:p-4">
                    <button
                      onClick={() => handleMarkShipped(f)}
                      className="px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 whitespace-nowrap"
                    >
                      Mark as Shipped
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal (used for both single and bulk) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md">
            <h2 className="text-lg md:text-xl font-bold mb-4">
              {isBulkAction
                ? `Mark ${selectedIds.size} Orders as Shipped`
                : selectedFulfillment
                ? `Mark Order #${selectedFulfillment.order.order_number} as Shipped`
                : ''}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                >
                  <option value="">Select carrier</option>
                  <option value="Moto">Moto</option>
                  <option value="Car">Car</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Phone number kiisa</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                  placeholder="gali numberka qofka delivery ah"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={isBulkAction ? handleBulkSubmitShipment : handleSubmitShipment}
                className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Shipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}