'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface CommissionTier {
  id: number;
  min_price: number | string;
  max_price: number | string;
  percentage: number | string;
  is_active: boolean;
}

export default function CommissionPage() {
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<CommissionTier>>({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTier, setNewTier] = useState({ min_price: 0, max_price: 0, percentage: 0, is_active: true });

  const fetchTiers = () => {
    api.get('/admin/commission-tiers')
      .then(res => setTiers(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const handleEdit = (tier: CommissionTier) => {
    setEditingId(tier.id);
    setEditForm({ ...tier });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await api.put(`/admin/commission-tiers/${editingId}`, editForm);
      fetchTiers();
      setEditingId(null);
    } catch (err: any) {
      const message = err.response?.data?.errors?.min_price?.[0] || 'Failed to save';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this tier?')) return;
    try {
      await api.delete(`/admin/commission-tiers/${id}`);
      fetchTiers();
    } catch {
      alert('Failed to delete');
    }
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      await api.post('/admin/commission-tiers', newTier);
      fetchTiers();
      setShowAdd(false);
      setNewTier({ min_price: 0, max_price: 0, percentage: 0, is_active: true });
    } catch (err: any) {
      const message = err.response?.data?.errors?.min_price?.[0] || 'Failed to create';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Commission Tiers</h1>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          + Add Tier
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">Min Price</th>
              <th className="text-left p-4">Max Price</th>
              <th className="text-left p-4">Percentage</th>
              <th className="text-left p-4">Active</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map(tier => (
              <tr key={tier.id} className="border-b">
                <td className="p-4">
                  {editingId === tier.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.min_price || ''}
                      onChange={e => setEditForm({ ...editForm, min_price: parseFloat(e.target.value) })}
                      className="w-24 px-2 py-1 border rounded"
                    />
                  ) : `$${Number(tier.min_price).toFixed(2)}`}
                </td>
                <td className="p-4">
                  {editingId === tier.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.max_price || ''}
                      onChange={e => setEditForm({ ...editForm, max_price: parseFloat(e.target.value) })}
                      className="w-24 px-2 py-1 border rounded"
                    />
                  ) : `$${Number(tier.max_price).toFixed(2)}`}
                </td>
                <td className="p-4">
                  {editingId === tier.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.percentage || ''}
                      onChange={e => setEditForm({ ...editForm, percentage: parseFloat(e.target.value) })}
                      className="w-20 px-2 py-1 border rounded"
                    />
                  ) : `${tier.percentage}%`}
                </td>
                <td className="p-4">
                  {editingId === tier.id ? (
                    <input
                      type="checkbox"
                      checked={editForm.is_active || false}
                      onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                    />
                  ) : tier.is_active ? '✅' : '❌'}
                </td>
                <td className="p-4">
                  {editingId === tier.id ? (
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={saving} className="text-green-600 hover:underline">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:underline">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(tier)} className="text-indigo-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(tier.id)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add Commission Tier</h2>
            <div className="space-y-3">
              <input
                type="number"
                step="0.01"
                placeholder="Min Price"
                value={newTier.min_price}
                onChange={e => setNewTier({...newTier, min_price: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Max Price"
                value={newTier.max_price}
                onChange={e => setNewTier({...newTier, max_price: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Percentage"
                value={newTier.percentage}
                onChange={e => setNewTier({...newTier, percentage: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newTier.is_active}
                  onChange={e => setNewTier({...newTier, is_active: e.target.checked})}
                /> Active
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded">
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}