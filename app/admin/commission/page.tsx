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

interface DeliveryFee {
  id: number;
  xafad: string;
  degmo: string;
  price: number | string;
  is_active: boolean;
}

export default function CommissionPage() {
  const [activeTab, setActiveTab] = useState<'commission' | 'delivery'>('commission');

  // ---------- Commission Tier states (your existing code) ----------
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

  // ---------- Delivery Fee states ----------
  const [fees, setFees] = useState<DeliveryFee[]>([]);
  const [loadingFees, setLoadingFees] = useState(true);
  const [editingFeeId, setEditingFeeId] = useState<number | null>(null);
  const [editFee, setEditFee] = useState<Partial<DeliveryFee>>({});
  const [savingFee, setSavingFee] = useState(false);
  const [showAddFee, setShowAddFee] = useState(false);
  const [newFee, setNewFee] = useState({ xafad: '', degmo: '', price: 0 });

  const fetchFees = () => {
    api.get('/admin/delivery-fees')
      .then(res => setFees(res.data))
      .finally(() => setLoadingFees(false));
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleEditFee = (fee: DeliveryFee) => {
    setEditingFeeId(fee.id);
    setEditFee({ price: fee.price, is_active: fee.is_active });
  };

  const handleSaveFee = async () => {
    if (!editingFeeId) return;
    setSavingFee(true);
    try {
      await api.put(`/admin/delivery-fees/${editingFeeId}`, editFee);
      fetchFees();
      setEditingFeeId(null);
    } catch {
      alert('Failed to save');
    } finally {
      setSavingFee(false);
    }
  };

  const handleDeleteFee = async (id: number) => {
    if (!confirm('Delete this fee?')) return;
    try {
      await api.delete(`/admin/delivery-fees/${id}`);
      fetchFees();
    } catch {
      alert('Failed to delete');
    }
  };

  const handleAddFee = async () => {
    setSavingFee(true);
    try {
      await api.post('/admin/delivery-fees', newFee);
      fetchFees();
      setShowAddFee(false);
      setNewFee({ xafad: '', degmo: '', price: 0 });
    } catch {
      alert('Failed to create');
    } finally {
      setSavingFee(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Pricing Settings</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('commission')}
          className={`px-4 py-2 font-medium ${activeTab === 'commission' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          Commission Tiers
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2 font-medium ${activeTab === 'delivery' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          Delivery Fees
        </button>
      </div>

      {/* ============ Commission Tiers Tab ============ */}
      {activeTab === 'commission' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Commission Tiers</h2>
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              + Add Tier
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
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
          )}

          {/* Add Tier Modal (your existing code) */}
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
      )}

      {/* ============ Delivery Fees Tab ============ */}
      {activeTab === 'delivery' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Delivery Fees</h2>
            <button onClick={() => setShowAddFee(true)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              + Add Fee
            </button>
          </div>

          {loadingFees ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4">Degmo</th>
                    <th className="text-left p-4">Xafad</th>
                    <th className="text-left p-4">Price (USD)</th>
                    <th className="text-left p-4">Active</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map(fee => (
                    <tr key={fee.id} className="border-b">
                      <td className="p-4">{fee.degmo}</td>
                      <td className="p-4">{fee.xafad}</td>
                      <td className="p-4">
                        {editingFeeId === fee.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editFee.price || ''}
                            onChange={e => setEditFee({...editFee, price: parseFloat(e.target.value)})}
                            className="w-24 px-2 py-1 border rounded"
                          />
                        ) : `$${Number(fee.price).toFixed(2)}`}
                      </td>
                      <td className="p-4">
                        {editingFeeId === fee.id ? (
                          <input
                            type="checkbox"
                            checked={editFee.is_active || false}
                            onChange={e => setEditFee({...editFee, is_active: e.target.checked})}
                          />
                        ) : fee.is_active ? '✅' : '❌'}
                      </td>
                      <td className="p-4">
                        {editingFeeId === fee.id ? (
                          <div className="flex gap-2">
                            <button onClick={handleSaveFee} disabled={savingFee} className="text-green-600 hover:underline">Save</button>
                            <button onClick={() => setEditingFeeId(null)} className="text-gray-500 hover:underline">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => handleEditFee(fee)} className="text-indigo-600 hover:underline">Edit</button>
                            <button onClick={() => handleDeleteFee(fee.id)} className="text-red-600 hover:underline">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Delivery Fee Modal */}
          {showAddFee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg w-96">
                <h2 className="text-xl font-bold mb-4">Add Delivery Fee</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Degmo"
                    value={newFee.degmo}
                    onChange={e => setNewFee({...newFee, degmo: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Xafad"
                    value={newFee.xafad}
                    onChange={e => setNewFee({...newFee, xafad: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price (USD)"
                    value={newFee.price}
                    onChange={e => setNewFee({...newFee, price: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowAddFee(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button onClick={handleAddFee} disabled={savingFee} className="px-4 py-2 bg-indigo-600 text-white rounded">
                    {savingFee ? 'Saving...' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}