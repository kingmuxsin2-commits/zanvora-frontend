'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  CheckCircle, XCircle, Eye, Search, CheckSquare, XSquare
} from 'lucide-react';
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
  supplier: {
    id: number;
    business_name: string;
  };
}

interface Supplier {
  id: number;
  business_name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'paused'>('pending');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = () => {
    setLoading(true);
    const params: any = {};
    if (filter !== 'all') params.status = filter;
    if (supplierFilter) params.supplier_id = supplierFilter;
    if (search) params.search = search;

    const endpoint = filter === 'pending' ? '/admin/products/pending' : '/admin/products/all';
    api.get(endpoint, { params })
      .then(res => {
        const data = res.data.data || res.data || [];
        setProducts(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  };

  const fetchSuppliers = () => {
    api.get('/admin/suppliers/all').then(res => setSuppliers(res.data));
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, supplierFilter, search]);

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      await api.post(`/admin/products/${id}/approve`);
      fetchProducts();
    } catch {
      alert('Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Enter rejection reason (optional):');
    setProcessing(id);
    try {
      await api.post(`/admin/products/${id}/reject`, { reason });
      fetchProducts();
    } catch {
      alert('Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedProducts.size === 0) return;
    setBulkProcessing(true);
    try {
      await api.post('/admin/products/bulk-approve', { ids: Array.from(selectedProducts) });
      setSelectedProducts(new Set());
      fetchProducts();
    } catch {
      alert('Bulk approve failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedProducts.size === 0) return;
    setBulkProcessing(true);
    try {
      await api.post('/admin/products/bulk-reject', { ids: Array.from(selectedProducts) });
      setSelectedProducts(new Set());
      fetchProducts();
    } catch {
      alert('Bulk reject failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedProducts(newSet);
  };

  const formatPrice = (price: string | number) => {
    return Number(price).toFixed(2);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Bulk Actions */}
          {selectedProducts.size > 0 && (
            <div className="flex gap-2 mr-2">
              <button
                onClick={handleBulkApprove}
                disabled={bulkProcessing}
                className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
              >
                <CheckSquare size={16} /> Approve ({selectedProducts.size})
              </button>
              <button
                onClick={handleBulkReject}
                disabled={bulkProcessing}
                className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
              >
                <XSquare size={16} /> Reject ({selectedProducts.size})
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-64"
            />
          </div>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            <option value="">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.business_name}</option>
            ))}
          </select>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(['all', 'pending', 'active', 'paused'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-md text-sm capitalize ${
                  filter === status ? 'bg-white shadow text-indigo-600' : 'text-gray-600'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={selectedProducts.size === products.length && products.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="text-left p-4">Product</th>
              <th className="text-left p-4">Supplier</th>
              <th className="text-left p-4">Wholesale</th>
              <th className="text-left p-4">Retail</th>
              <th className="text-left p-4">Stock</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {p.images?.[0] ? (
                      <img src={getImageUrl(p.images[0])} alt="" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                        No img
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-gray-500 text-xs truncate max-w-[200px]">{p.description}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">{p.supplier?.business_name}</td>
                <td className="p-4">${formatPrice(p.wholesale_price)}</td>
                <td className="p-4">${formatPrice(p.retail_price)}</td>
                <td className="p-4">{p.stock_qty}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    p.status === 'active' ? 'bg-green-100 text-green-800' :
                    p.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPreviewProduct(p); setShowPreview(true); }}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Customer Preview"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => { setSelectedProduct(p); setShowModal(true); }}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    {p.status === 'pending_review' && (
                      <>
                        <button
                          onClick={() => handleApprove(p.id)}
                          disabled={processing === p.id}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleReject(p.id)}
                          disabled={processing === p.id}
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

      {/* Customer Preview Modal */}
      {showPreview && previewProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Customer Preview</h2>
              <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-gray-100 rounded">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="max-w-sm mx-auto border rounded-lg overflow-hidden">
                <div className="aspect-square bg-gray-100">
                  {previewProduct.images?.[0] ? (
                    <img src={getImageUrl(previewProduct.images[0])} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{previewProduct.title}</h3>
                  <p className="text-gray-600 text-sm">Sold by {previewProduct.supplier?.business_name}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-yellow-400">★★★★☆</span>
                    <span className="text-gray-500 text-sm">(0 reviews)</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">${formatPrice(previewProduct.retail_price)}</p>
                  <p className="text-sm text-gray-500 mt-1">Wholesale: ${formatPrice(previewProduct.wholesale_price)}</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-3">
                    {previewProduct.description?.split(/\n|\.\s+/).filter(line => line.trim()).slice(0, 3).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                  <button className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg">Add to Cart</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{selectedProduct.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">{selectedProduct.description || 'No description'}</p>
                <dl className="mt-4 space-y-2">
                  <div><dt className="font-medium">Supplier:</dt><dd>{selectedProduct.supplier.business_name}</dd></div>
                  <div><dt className="font-medium">Wholesale Price:</dt><dd>${formatPrice(selectedProduct.wholesale_price)}</dd></div>
                  <div><dt className="font-medium">Retail Price:</dt><dd>${formatPrice(selectedProduct.retail_price)}</dd></div>
                  <div><dt className="font-medium">Stock:</dt><dd>{selectedProduct.stock_qty}</dd></div>
                  <div><dt className="font-medium">Status:</dt><dd className="capitalize">{selectedProduct.status.replace('_', ' ')}</dd></div>
                  <div><dt className="font-medium">Created:</dt><dd>{new Date(selectedProduct.created_at).toLocaleString()}</dd></div>
                </dl>
              </div>
              <div>
                <p className="font-medium mb-2">Images:</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProduct.images?.map((img, idx) => (
                    <img key={idx} src={getImageUrl(img)} alt={`Product ${idx + 1}`} className="w-full h-32 object-cover rounded" />
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setShowModal(false)} className="mt-4 px-4 py-2 bg-gray-100 rounded w-full">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}