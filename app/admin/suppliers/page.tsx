'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  CheckCircle, XCircle, Eye, Plus,
  ToggleLeft, ToggleRight
} from 'lucide-react';

interface Supplier {
  id: number;
  business_name: string;
  address: string;
  is_approved: boolean;
  created_at: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Add Supplier modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    address: '',
    password: '',
    password_confirmation: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = () => {
    const endpoint = filter === 'pending' ? '/admin/suppliers/pending' : '/admin/suppliers';
    api.get(endpoint)
      .then(res => {
        const data = res.data.data || res.data || [];
        let filtered = Array.isArray(data) ? data : [];
        if (filter === 'approved') {
          filtered = filtered.filter((s: Supplier) => s.is_approved);
        }
        setSuppliers(filtered);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSuppliers();
  }, [filter]);

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      await api.post(`/admin/suppliers/${id}/approve`);
      fetchSuppliers();
    } catch {
      alert('Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessing(id);
    try {
      await api.post(`/admin/suppliers/${id}/reject`);
      fetchSuppliers();
    } catch {
      alert('Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    setProcessing(supplier.id);
    try {
      await api.post(`/admin/suppliers/${supplier.id}/toggle-status`);
      fetchSuppliers();
    } catch {
      alert('Failed to toggle status');
    } finally {
      setProcessing(null);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      alert('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/suppliers', formData);
      fetchSuppliers();
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        business_name: '',
        address: '',
        password: '',
        password_confirmation: '',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create supplier');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Suppliers</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded ${filter === 'approved' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
          >
            Approved
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1"
          >
            <Plus size={18} /> Add Supplier
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">Business</th>
              <th className="text-left p-4">Contact</th>
              <th className="text-left p-4">Address</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Joined</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{s.business_name}</td>
                <td className="p-4">
                  {s.user.name}<br />
                  <span className="text-gray-500 text-xs">{s.user.email}<br />{s.user.phone}</span>
                </td>
                <td className="p-4">{s.address}</td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggleStatus(s)}
                    disabled={processing === s.id}
                    className="flex items-center gap-1"
                    title={s.is_approved ? 'Deactivate supplier' : 'Activate supplier'}
                  >
                    {s.is_approved ? (
                      <>
                        <ToggleRight className="text-green-600" size={20} />
                        <span className="text-green-800 text-xs">Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="text-gray-400" size={20} />
                        <span className="text-gray-600 text-xs">Deactivated</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="p-4 whitespace-nowrap">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedSupplier(s); setShowModal(true); }}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    {/* Legacy pending suppliers: show approve/reject */}
                    {!s.is_approved && (
                      <>
                        <button
                          onClick={() => handleApprove(s.id)}
                          disabled={processing === s.id}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleReject(s.id)}
                          disabled={processing === s.id}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {showModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{selectedSupplier.business_name}</h2>
            <dl className="space-y-2">
              <div><dt className="font-medium">Contact Name:</dt><dd>{selectedSupplier.user.name}</dd></div>
              <div><dt className="font-medium">Email:</dt><dd>{selectedSupplier.user.email}</dd></div>
              <div><dt className="font-medium">Phone:</dt><dd>{selectedSupplier.user.phone}</dd></div>
              <div><dt className="font-medium">Address:</dt><dd>{selectedSupplier.address}</dd></div>
              <div><dt className="font-medium">Status:</dt><dd>{selectedSupplier.is_approved ? 'Approved' : 'Pending'}</dd></div>
              <div><dt className="font-medium">Joined:</dt><dd>{new Date(selectedSupplier.created_at).toLocaleString()}</dd></div>
            </dl>
            <button onClick={() => setShowModal(false)} className="mt-4 px-4 py-2 bg-gray-100 rounded w-full">Close</button>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Supplier</h2>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
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
                <label className="block text-sm font-medium mb-1">Address *</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password_confirmation}
                  onChange={e => setFormData({...formData, password_confirmation: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}