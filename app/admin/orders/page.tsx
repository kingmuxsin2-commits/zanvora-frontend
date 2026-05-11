'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Eye, Search, Truck, Calendar, Users, MapPin } from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  total_amount: string | number;
  status: string;
  payment_status: string;
  created_at: string;
  payment_confirmed_at?: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    id: number;
    product: {
      title: string;
      supplier?: {
        id: number;
        business_name: string;
        address: string;
      };
    };
    quantity: number;
    unit_price: string | number;
  }>;
  fulfillments?: Array<{
    id: number;
    status: string;
    tracking_number: string | null;
    carrier: string | null;
    supplier: { id: number; business_name: string };
  }>;
  shipping_address?: {
    name?: string;
    phone?: string;
    address?: string;        // degmo – xaafad
    landmark?: string;       // ✅ new field
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

  const [activeTab, setActiveTab] = useState<'orders' | 'delivery' | 'customers' | 'region'>('orders');
  const [deliveryOrders, setDeliveryOrders] = useState<Order[]>([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );

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

  const fetchDeliveryList = () => {
    setDeliveryLoading(true);
    const params = new URLSearchParams();
    if (deliveryDate) params.append('date', deliveryDate);

    api.get(`/admin/orders/delivery-list?${params}`)
      .then(res => {
        const data = res.data.data || res.data || [];
        setDeliveryOrders(Array.isArray(data) ? data : []);
      })
      .finally(() => setDeliveryLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [filter, search]);

  useEffect(() => {
    if (activeTab !== 'orders') {
      fetchDeliveryList();
    }
  }, [activeTab, deliveryDate]);

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

  const formatSLSH = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(num);
    return `${formatted} SLSH`;
  };

  const getFulfillmentStatus = (order: Order, supplierId: number): { label: string; colorClass: string } => {
    const fulfillment = order.fulfillments?.find(f => f.supplier.id === supplierId);
    if (!fulfillment) return { label: 'N/A', colorClass: 'bg-gray-100 text-gray-800' };
    switch (fulfillment.status) {
      case 'shipped':
        return { label: 'Shipped', colorClass: 'bg-blue-100 text-blue-800' };
      case 'delivered':
        return { label: 'Delivered', colorClass: 'bg-green-100 text-green-800' };
      default:
        return { label: 'Pending', colorClass: 'bg-yellow-100 text-yellow-800' };
    }
  };

  // Group delivery orders by supplier
  const groupedBySupplier = deliveryOrders.reduce<Record<number, {
    supplier: { id: number; business_name: string; address: string };
    orders: Order[];
  }>>((acc, order) => {
    const firstItem = order.items?.[0];
    const supplier = firstItem?.product?.supplier;
    if (!supplier) return acc;

    if (!acc[supplier.id]) {
      acc[supplier.id] = {
        supplier: {
          id: supplier.id,
          business_name: supplier.business_name,
          address: supplier.address,
        },
        orders: [],
      };
    }
    acc[supplier.id].orders.push(order);
    return acc;
  }, {});

  // Group delivery orders by customer
  const groupedByCustomer = deliveryOrders.reduce<Record<number, {
    customer: { id: number; name: string; phone: string };
    orders: Order[];
  }>>((acc, order) => {
    const customer = order.customer;
    if (!customer) return acc;

    if (!acc[customer.id]) {
      acc[customer.id] = {
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
        },
        orders: [],
      };
    }
    acc[customer.id].orders.push(order);
    return acc;
  }, {});

  // Group delivery orders by region (degmo/xaafad)
  const groupedByRegion = deliveryOrders.reduce<Record<string, {
    region: string;
    orders: Order[];
  }>>((acc, order) => {
    const regionName = order.shipping_address?.address || 'Unknown Region';
    if (!acc[regionName]) {
      acc[regionName] = {
        region: regionName,
        orders: [],
      };
    }
    acc[regionName].orders.push(order);
    return acc;
  }, {});

  const supplierGroups = Object.values(groupedBySupplier);
  const customerGroups = Object.values(groupedByCustomer);
  const regionGroups = Object.values(groupedByRegion);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex gap-2">
          <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="Orders" />
          <TabButton active={activeTab === 'delivery'} onClick={() => setActiveTab('delivery')} icon={<Truck size={16} />} label="Delivery List" />
          <TabButton active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={<Users size={16} />} label="Customer List" />
          <TabButton active={activeTab === 'region'} onClick={() => setActiveTab('region')} icon={<MapPin size={16} />} label="Region List" />
        </div>
      </div>

      {activeTab === 'orders' ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
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
              <thead className="bg-gray-50 border-b"><tr><th className="text-left p-4">Order #</th><th className="text-left p-4">Customer</th><th className="text-left p-4">Total</th><th className="text-left p-4">Status</th><th className="text-left p-4">Payment</th><th className="text-left p-4">Date</th><th className="text-left p-4">Actions</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b hover:bg-gray-50"><td className="p-4 font-mono">{o.order_number}</td><td className="p-4">{o.customer.name}<br /><span className="text-gray-500 text-xs">{o.customer.email}</span></td><td className="p-4 font-medium">{formatSLSH(o.total_amount)}</td><td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${o.status === 'delivered' ? 'bg-green-100 text-green-800' : o.status === 'cancelled' ? 'bg-red-100 text-red-800' : o.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{o.status.replace('_', ' ')}</span></td><td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${o.payment_status === 'paid' ? 'bg-green-100 text-green-800' : o.payment_status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{o.payment_status.replace('_', ' ')}</span></td><td className="p-4 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</td><td className="p-4"><button onClick={() => openModal(o)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="View Details"><Eye size={18} /></button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : activeTab === 'delivery' ? (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
              <Calendar size={18} className="text-gray-400" />
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="text-sm border-0 focus:ring-0" />
            </div>
            <button onClick={fetchDeliveryList} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Load</button>
          </div>

          {deliveryLoading ? (
            <div className="p-8 text-center">Loading delivery list...</div>
          ) : supplierGroups.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-lg"><p className="text-gray-500">No confirmed orders for this date.</p></div>
          ) : (
            <div className="space-y-6">
              {supplierGroups.map(group => (
                <div key={group.supplier.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b"><h2 className="text-lg font-semibold">{group.supplier.business_name}</h2><p className="text-sm text-gray-500">Pick‑up: {group.supplier.address}</p></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b"><tr><th className="text-left p-3">Order #</th><th className="text-left p-3">Customer</th><th className="text-left p-3">Items</th><th className="text-left p-3">Delivery Address</th><th className="text-left p-3">Status</th></tr></thead>
                      <tbody>
                        {group.orders.map(order => {
                          const status = getFulfillmentStatus(order, group.supplier.id);
                          return (
                            <tr key={order.id} className="border-b hover:bg-gray-50"><td className="p-3 font-mono">{order.order_number}</td><td className="p-3">{order.customer.name}</td><td className="p-3">{order.items.map(item => (<div key={item.id}>{item.product.title} x {item.quantity}</div>))}</td><td className="p-3">{order.shipping_address ? (<><p className="font-medium">{order.shipping_address.name}</p><p className="text-xs text-gray-500">{order.shipping_address.phone}</p><p className="text-xs text-gray-600">{order.shipping_address.address}</p>{order.shipping_address.landmark && (<p className="text-xs text-gray-500">Gaar ahaan: {order.shipping_address.landmark}</p>)}</>) : (<span className="text-gray-400">—</span>)}</td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${status.colorClass}`}>{status.label}</span></td></tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'customers' ? (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
              <Calendar size={18} className="text-gray-400" />
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="text-sm border-0 focus:ring-0" />
            </div>
            <button onClick={fetchDeliveryList} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Load</button>
          </div>

          {deliveryLoading ? (
            <div className="p-8 text-center">Loading delivery list...</div>
          ) : customerGroups.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-lg"><p className="text-gray-500">No confirmed orders for this date.</p></div>
          ) : (
            <div className="space-y-6">
              {customerGroups.map(group => (
                <div key={group.customer.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b"><h2 className="text-lg font-semibold">{group.customer.name}</h2><p className="text-sm text-gray-500">Phone: {group.customer.phone}</p></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b"><tr><th className="text-left p-3">Order #</th><th className="text-left p-3">Items</th><th className="text-left p-3">Delivery Address</th><th className="text-left p-3">Status</th></tr></thead>
                      <tbody>
                        {group.orders.map(order => {
                          const firstSupplierId = order.items?.[0]?.product?.supplier?.id;
                          const status = firstSupplierId ? getFulfillmentStatus(order, firstSupplierId) : { label: 'N/A', colorClass: 'bg-gray-100 text-gray-800' };
                          return (
                            <tr key={order.id} className="border-b hover:bg-gray-50"><td className="p-3 font-mono">{order.order_number}</td><td className="p-3">{order.items.map(item => (<div key={item.id}>{item.product.title} x {item.quantity}</div>))}</td><td className="p-3">{order.shipping_address ? (<><p className="font-medium">{order.shipping_address.name}</p><p className="text-xs text-gray-500">{order.shipping_address.phone}</p><p className="text-xs text-gray-600">{order.shipping_address.address}</p>{order.shipping_address.landmark && (<p className="text-xs text-gray-500">Gaar ahaan: {order.shipping_address.landmark}</p>)}</>) : (<span className="text-gray-400">—</span>)}</td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${status.colorClass}`}>{status.label}</span></td></tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Region List Tab */
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
              <Calendar size={18} className="text-gray-400" />
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="text-sm border-0 focus:ring-0" />
            </div>
            <button onClick={fetchDeliveryList} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Load</button>
          </div>

          {deliveryLoading ? (
            <div className="p-8 text-center">Loading delivery list...</div>
          ) : regionGroups.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-lg"><p className="text-gray-500">No confirmed orders for this date.</p></div>
          ) : (
            <div className="space-y-6">
              {regionGroups.map(group => (
                <div key={group.region} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b"><h2 className="text-lg font-semibold">{group.region}</h2></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b"><tr><th className="text-left p-3">Order #</th><th className="text-left p-3">Customer</th><th className="text-left p-3">Items</th><th className="text-left p-3">Status</th></tr></thead>
                      <tbody>
                        {group.orders.map(order => {
                          const firstSupplierId = order.items?.[0]?.product?.supplier?.id;
                          const status = firstSupplierId ? getFulfillmentStatus(order, firstSupplierId) : { label: 'N/A', colorClass: 'bg-gray-100 text-gray-800' };
                          return (
                            <tr key={order.id} className="border-b hover:bg-gray-50"><td className="p-3 font-mono">{order.order_number}</td><td className="p-3">{order.customer.name}</td><td className="p-3">{order.items.map(item => (<div key={item.id}>{item.product.title} x {item.quantity}</div>))}</td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${status.colorClass}`}>{status.label}</span></td></tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal – with landmark */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {modalLoading || !selectedOrder ? (
              <div className="text-center py-8">Loading order details...</div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Order #{selectedOrder.order_number}</h2>
                <div className="space-y-4">
                  <div><h3 className="font-medium">Customer</h3><p>{selectedOrder.customer.name}</p><p className="text-sm text-gray-600">{selectedOrder.customer.email} • {selectedOrder.customer.phone}</p></div>
                  {selectedOrder.shipping_address && (
                    <div>
                      <h3 className="font-medium">Shipping Address</h3>
                      <p>{selectedOrder.shipping_address.name}</p>
                      <p>{selectedOrder.shipping_address.phone}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.shipping_address.address}</p>
                      {selectedOrder.shipping_address.landmark && (
                        <p className="text-xs text-gray-500">Gaar ahaan: {selectedOrder.shipping_address.landmark}</p>
                      )}
                    </div>
                  )}
                  <div><h3 className="font-medium">Items</h3><ul className="divide-y">{selectedOrder.items.map(item => (<li key={item.id} className="py-2 flex justify-between"><span>{item.product.title} x {item.quantity}</span><span>{formatSLSH(Number(item.unit_price))}</span></li>))}</ul></div>
                  <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span>{formatSLSH(selectedOrder.total_amount)}</span></div>
                  <div className="grid grid-cols-2 gap-2 text-sm"><div><span className="font-medium">Status:</span> {selectedOrder.status}</div><div><span className="font-medium">Payment:</span> {selectedOrder.payment_status}</div><div><span className="font-medium">Placed:</span> {new Date(selectedOrder.created_at).toLocaleString()}</div></div>
                  {selectedOrder.fulfillments && selectedOrder.fulfillments.length > 0 && (
                    <div className="border-t pt-4"><h3 className="font-medium mb-2">Fulfillments</h3><div className="space-y-2">{selectedOrder.fulfillments.map(f => (<div key={f.id} className="border p-3 rounded flex items-center justify-between"><div><p className="font-medium">{f.supplier?.business_name || 'Unknown Supplier'}</p><p className="text-sm text-gray-600">Status: <span className="capitalize">{f.status}</span>{f.tracking_number && (<> · Tracking: {f.tracking_number} ({f.carrier})</>)}</p></div>{f.status === 'shipped' && (<button onClick={() => handleMarkDelivered(f.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">Mark Delivered</button>)}{f.status === 'delivered' && (<span className="text-green-600 text-sm">✓ Delivered</span>)}</div>))}</div></div>
                  )}
                </div>
                <button onClick={() => setShowModal(false)} className="mt-4 px-4 py-2 bg-gray-100 rounded w-full">Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon?: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
        active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}