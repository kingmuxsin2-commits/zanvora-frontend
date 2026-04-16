'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CheckCircle, XCircle, Eye, Search } from 'lucide-react';

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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'paused'>('pending');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchProducts = () => {
    const endpoint = filter === 'pending' ? '/admin/products/pending' : '/admin/products/all';
    api.get(endpoint)
      .then(res => {
        const data = res.data.data || res.data || [];
        let filtered = Array.isArray(data) ? data : [];
        if (filter !== 'pending' && filter !== 'all') {
          filtered = filtered.filter((p: Product) => p.status === filter);
        }
        if (search) {
          filtered = filtered.filter((p: Product) =>
            p.title.toLowerCase().includes(search.toLowerCase())
          );
        }
        setProducts(filtered);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [filter, search]);

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

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex flex-wrap gap-2">
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
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded ${filter === 'active' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('paused')}
            className={`px-4 py-2 rounded ${filter === 'paused' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
          >
            Paused
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">Product</th>
              <th className="text-left p-4">Supplier</th>
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
                <td className="p-4">{p.supplier?.business_name}</td>
                <td className="p-4">
                  <span className="font-medium">${Number(p.retail_price).toFixed(2)}</span>
                  <br />
                  <span className="text-gray-500 text-xs">Wholesale: ${Number(p.wholesale_price).toFixed(2)}</span>
                </td>
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
                      onClick={() => { setSelectedProduct(p); setShowModal(true); }}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
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
                  <div><dt className="font-medium">Wholesale Price:</dt><dd>${Number(selectedProduct.wholesale_price).toFixed(2)}</dd></div>
                  <div><dt className="font-medium">Retail Price:</dt><dd>${Number(selectedProduct.retail_price).toFixed(2)}</dd></div>
                  <div><dt className="font-medium">Stock:</dt><dd>{selectedProduct.stock_qty}</dd></div>
                  <div><dt className="font-medium">Status:</dt><dd className="capitalize">{selectedProduct.status.replace('_', ' ')}</dd></div>
                  <div><dt className="font-medium">Created:</dt><dd>{new Date(selectedProduct.created_at).toLocaleString()}</dd></div>
                </dl>
              </div>
              <div>
                <p className="font-medium mb-2">Images:</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProduct.images?.map((img, idx) => (
                    <img key={idx} src={img} alt={`Product ${idx+1}`} className="w-full h-32 object-cover rounded" />
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