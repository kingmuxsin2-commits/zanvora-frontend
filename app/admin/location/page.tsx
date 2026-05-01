'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MapPin, Save, X } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  degmo: string;
  xafad: string;
  gps: string | null;
}

export default function AdminLocationPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [gpsValue, setGpsValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCustomers = () => {
    api.get('/admin/location/customers')
      .then(res => setCustomers(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleEditGps = (customer: Customer) => {
    setEditingId(customer.id);
    setGpsValue(customer.gps || '');
  };

  const handleSaveGps = async (customerId: number) => {
    setSaving(true);
    try {
      await api.post(`/admin/location/customers/${customerId}/gps`, { gps: gpsValue });
      fetchCustomers();
      setEditingId(null);
      setGpsValue('');
    } catch {
      alert('Failed to save GPS');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="text-indigo-600" size={28} />
        <h1 className="text-3xl font-bold">Customer Locations</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Phone</th>
              <th className="text-left p-4">Degmo</th>
              <th className="text-left p-4">Xafad</th>
              <th className="text-left p-4">GPS Coordinates</th>
              <th className="text-left p-4"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{c.id}</td>
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4">{c.phone}</td>
                <td className="p-4">{c.degmo}</td>
                <td className="p-4">{c.xafad}</td>
                <td className="p-4">
                  {editingId === c.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={gpsValue}
                        onChange={(e) => setGpsValue(e.target.value)}
                        placeholder="lat, lng"
                        className="w-32 px-2 py-1 border rounded text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveGps(c.id)}
                        disabled={saving}
                        className="text-green-600 hover:underline"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-500 hover:underline"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditGps(c)}
                      className="text-indigo-600 hover:underline"
                    >
                      {c.gps || '—'}
                    </button>
                  )}
                </td>
                <td className="p-4" />
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No customers with orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}