'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface OrderItem {
  id: number;
  product: {
    title: string;
  };
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
    customer: {
      name: string;
      phone: string;
    };
    shipping_address: {
      address: string;
      city: string;
    };
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

  useEffect(() => {
    setHydrated(true);
  }, []);

  const fetchOrders = () => {
    api.get('/supplier/orders')
      .then((res: { data: Fulfillment[] }) => setFulfillments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!hydrated) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchOrders();
  }, [hydrated, router]);

  const handleMarkShipped = (fulfillment: Fulfillment) => {
    setSelectedFulfillment(fulfillment);
    setCarrier('');
    setTrackingNumber('');
    setShowModal(true);
  };

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
    } catch (error) {
      alert('Failed to mark as shipped. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hydrated || loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Orders to Fulfill</h1>

      {fulfillments.length === 0 ? (
        <div className="bg-white p-6 md:p-8 text-center rounded-lg">
          <p className="text-gray-500">No pending orders to fulfill.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 md:p-4">Order #</th>
                <th className="text-left p-3 md:p-4">Customer</th>
                <th className="text-left p-3 md:p-4">Items</th>
                <th className="text-left p-3 md:p-4">Address</th>
                <th className="text-left p-3 md:p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fulfillments.map(f => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 md:p-4 font-mono">{f.order.order_number}</td>
                  <td className="p-3 md:p-4">
                    {f.order.customer.name}<br />
                    <span className="text-xs md:text-sm text-gray-500">{f.order.customer.phone}</span>
                  </td>
                  <td className="p-3 md:p-4">
                    {f.order.items.map(item => (
                      <div key={item.id}>
                        {item.product.title} x {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="p-3 md:p-4">
                    {f.order.shipping_address.address}<br />
                    <span className="text-xs md:text-sm text-gray-500">{f.order.shipping_address.city}</span>
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

      {/* Modal */}
      {showModal && selectedFulfillment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md">
            <h2 className="text-lg md:text-xl font-bold mb-4">
              Mark Order #{selectedFulfillment.order.order_number} as Shipped
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
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="USPS">USPS</option>
                  <option value="DHL">DHL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                  placeholder="Enter tracking number"
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
                onClick={handleSubmitShipment}
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