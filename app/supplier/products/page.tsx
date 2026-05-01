'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight, X, Upload, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/getImageUrl';   // ✅ shared helper

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
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    wholesale_price: '',
    stock_qty: '',
    status: 'draft',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const resetForm = () => {
    setFormData({ title: '', description: '', wholesale_price: '', stock_qty: '', status: 'draft' });
    setImageFiles([]);
    setImagePreviewUrls([]);
    setExistingImages([]);
    setEditingProduct(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length + existingImages.length > 5) {
      alert('You can upload up to 5 images.');
      return;
    }
    setImageFiles(prev => [...prev, ...files]);
    const urls = files.map(f => URL.createObjectURL(f));
    setImagePreviewUrls(prev => [...prev, ...urls]);
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('wholesale_price', formData.wholesale_price);
    payload.append('stock_qty', formData.stock_qty);
    payload.append('status', formData.status);
    
    imageFiles.forEach(file => payload.append('images[]', file));
    payload.append('existing_images', JSON.stringify(existingImages));

    try {
      if (editingProduct) {
        await api.post(`/supplier/products/${editingProduct.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/supplier/products', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert('Failed to save product');
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
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || '',
      wholesale_price: String(product.wholesale_price),
      stock_qty: String(product.stock_qty),
      status: product.status,
    });
    setExistingImages(product.images || []);
    setImageFiles([]);
    setImagePreviewUrls([]);
    setShowModal(true);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Products</h1>
        <button
          type="button"
          onClick={() => { resetForm(); setShowModal(true); }}
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
                      <img src={getImageUrl(p.images[0])} alt={p.title} className="w-10 h-10 object-cover rounded" />
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
                  <button onClick={() => handleToggleStatus(p)} className="flex items-center gap-1 text-sm">
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-indigo-600 text-sm hover:underline"
              >
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
            </div>
            
            {showPreview && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-medium mb-2">Preview (Customer View)</h3>
                <div className="max-w-sm border rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-100">
                    {(imagePreviewUrls[0] || existingImages[0]) ? (
                      <img 
                        src={imagePreviewUrls[0] || getImageUrl(existingImages[0])} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium">{formData.title || 'Product Title'}</p>
                    <p className="text-sm text-gray-500">Your Store</p>
                    <p className="text-lg font-bold mt-1">
                      ${formData.wholesale_price ? Number(formData.wholesale_price).toFixed(2) : '0.00'}
                      <span className="text-xs font-normal text-gray-500 ml-1">(Wholesale)</span>
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                      {formData.description.split(/\n|\.\s+/).filter(line => line.trim()).slice(0, 3).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium mb-1">
                  Description 
                  <span className="text-gray-400 text-xs ml-2">(Use bullet points: start each line with a dash or asterisk)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  rows={4}
                  placeholder="- Feature one&#10;- Feature two&#10;- Feature three"
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
                <label className="block text-sm font-medium mb-1">
                  <ImageIcon size={16} className="inline mr-1" />
                  Images (max 5)
                </label>
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={24} className="mx-auto text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Click or drag to upload</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                {(existingImages.length > 0 || imagePreviewUrls.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {existingImages.map((url, idx) => (
                      <div key={`existing-${idx}`} className="relative w-16 h-16">
                        <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {imagePreviewUrls.map((url, idx) => (
                      <div key={`new-${idx}`} className="relative w-16 h-16">
                        <img src={url} alt="" className="w-full h-full object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
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
                  {editingProduct?.status === 'active' && <option value="active">Active</option>}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}