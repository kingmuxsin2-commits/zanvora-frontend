'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: number;
  title: string;
  description: string | null;
  wholesale_price: string | number;
  retail_price: string | number;
  stock_qty: number;
  images: string[];
  status: string;
  created_at: string;
}

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    wholesale_price: '',
    stock_qty: '',
    images: [] as File[],
    status: 'draft',
  });
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchProducts = () => {
    api.get('/supplier/products')
      .then(res => {
        const data = res.data.data || res.data || [];
        setProducts(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({ ...formData, images: files });
    const urls = files.map(f => URL.createObjectURL(f));
    setImagePreviewUrls(urls);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', wholesale_price: '', stock_qty: '', images: [], status: 'draft' });
    setImagePreviewUrls([]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('wholesale_price', formData.wholesale_price);
    payload.append('stock_qty', formData.stock_qty);
    payload.append('status', formData.status);
    formData.images.forEach(img => payload.append('images[]', img));
    
    try {
      await api.post('/supplier/products', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchProducts();
      setShowAddModal(false);
      resetForm();
    } catch {
      alert('Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSaving(true);
    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('wholesale_price', formData.wholesale_price);
    payload.append('stock_qty', formData.stock_qty);
    payload.append('status', formData.status);
    formData.images.forEach(img => payload.append('images[]', img));
    if (formData.images.length === 0) {
      // If no new images, we don't send the field so backend keeps existing ones
    }
    
    try {
      await api.post(`/supplier/products/${selectedProduct.id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchProducts();
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
    } catch {
      alert('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/supplier/products/${id}`);
      fetchProducts();
    } catch {
      alert('Failed to delete');
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'paused' : 'active';
    try {
      await api.put(`/supplier/products/${product.id}`, { status: newStatus });
      fetchProducts();
    } catch {
      alert('Failed to update status');
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      title: product.title,
      description: product.description || '',
      wholesale_price: String(product.wholesale_price),
      stock_qty: String(product.stock_qty),
      images: [],
      status: product.status,
    });
    setImagePreviewUrls(product.images || []);
    setShowEditModal(true);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Products</h1>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">Product</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Stock</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {p.images?.[0] && (
                      <img src={p.images[0]} alt={p.title} className="w-10 h-10 object-cover rounded" />
                    )}
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-gray-500 text-xs truncate max-w-[200px]">{p.description}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-medium">${Number(p.retail_price).toFixed(2)}</span>
                  <br />
                  <span className="text-gray-500 text-xs">Wholesale: ${Number(p.wholesale_price).toFixed(2)}</span>
                </td>
                <td className="p-4">{p.stock_qty}</td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggleStatus(p)}
                    className="flex items-center gap-1 text-sm"
                  >
                    {p.status === 'active' ? (
                      <><ToggleRight className="text-green-600" size={20} /> Active</>
                    ) : p.status === 'pending_review' ? (
                      <span className="text-yellow-600">Pending</span>
                    ) : (
                      <><ToggleLeft className="text-gray-400" size={20} /> Paused</>
                    )}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Link href={`/product/${p.id}`} target="_blank" className="p-1 text-indigo-600 hover:bg-indigo-50 rounded">
                      <Eye size={18} />
                    </Link>
                    <button onClick={() => openEditModal(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal - same form for both, differentiate by mode */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{showAddModal ? 'Add Product' : 'Edit Product'}</h2>
            <form onSubmit={showAddModal ? handleCreate : handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Wholesale Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.wholesale_price}
                    onChange={e => setFormData({...formData, wholesale_price: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock_qty}
                    onChange={e => setFormData({...formData, stock_qty: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Images (max 5)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full"
                />
                {imagePreviewUrls.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {imagePreviewUrls.map((url, idx) => (
                      <img key={idx} src={url} alt="Preview" className="w-16 h-16 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="draft">Draft</option>
                  <option value="pending_review">Submit for Review</option>
                  <option value="paused">Paused (Hidden)</option>
                  {selectedProduct?.status === 'active' && <option value="active">Active</option>}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (showAddModal ? 'Create' : 'Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}