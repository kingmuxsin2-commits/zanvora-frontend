'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Save } from 'lucide-react';

export default function SupplierStoreSettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    address: '',
    shipping_flat_fee: '',
    payment_details: {
      paypal_email: '',
      venmo_handle: '',
      bank_details: '',
    },
  });

  useEffect(() => {
    if (user?.supplier) {
      const supplier = user.supplier;
      const pd = supplier.payment_details || {};
      setFormData({
        business_name: supplier.business_name || '',
        address: supplier.address || '',
        shipping_flat_fee: String(supplier.shipping_flat_fee ?? '0'),
        payment_details: {
          paypal_email: pd.paypal_email || '',
          venmo_handle: pd.venmo_handle || '',
          bank_details: pd.bank_details || '',
        },
      });
    }
    setLoading(false);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/supplier/settings', {
        ...formData,
        shipping_flat_fee: parseFloat(formData.shipping_flat_fee) || 0,
      });
      alert('Settings saved successfully');
    } catch {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Store Settings</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Business Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={e => setFormData({...formData, business_name: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Business Address *</label>
              <textarea
                required
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Shipping Settings</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Flat Shipping Fee ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.shipping_flat_fee}
              onChange={e => setFormData({...formData, shipping_flat_fee: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            />
            <p className="text-gray-500 text-sm mt-1">This fee will be added to each order containing your products.</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">PayPal Email</label>
              <input
                type="email"
                value={formData.payment_details.paypal_email}
                onChange={e => setFormData({
                  ...formData,
                  payment_details: { ...formData.payment_details, paypal_email: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Venmo Handle</label>
              <input
                type="text"
                value={formData.payment_details.venmo_handle}
                onChange={e => setFormData({
                  ...formData,
                  payment_details: { ...formData.payment_details, venmo_handle: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Details (for wire transfer)</label>
              <textarea
                value={formData.payment_details.bank_details}
                onChange={e => setFormData({
                  ...formData,
                  payment_details: { ...formData.payment_details, bank_details: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
                placeholder="Account name, bank name, account number, routing number"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}