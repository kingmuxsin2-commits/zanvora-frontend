'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const LOW_STOCK_THRESHOLD = 5;

interface Product {
  id: number;
  title: string;
  wholesale_price: number | string;
  retail_price: number | string;
  stock_qty: number;
  status: string;
  created_at: string;
}

export default function SupplierInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const perPage = 15;

  const fetchInventory = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get('/supplier/products', {
        params: { page, per_page: perPage, search, sort, order: sortOrder },
      });
      setProducts(res.data.data);
      setCurrentPage(res.data.current_page);
      setLastPage(res.data.last_page);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Failed to load inventory', error);
    } finally {
      setLoading(false);
    }
  }, [search, sort, sortOrder]);

  useEffect(() => {
    fetchInventory(1);
  }, [fetchInventory]);

  const handleSort = (column: string) => {
    if (sort === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(column);
      setSortOrder('asc');
    }
  };

  const handleStockChange = async (productId: number, newStock: number) => {
    if (newStock < 0) return;
    // Optimistic update
    setProducts(prev => prev.map(p => (p.id === productId ? { ...p, stock_qty: newStock } : p)));
    setUpdatingId(productId);
    try {
      await api.put(`/supplier/products/${productId}/stock`, { stock_qty: newStock });
    } catch {
      fetchInventory(currentPage); // revert on error
    } finally {
      setUpdatingId(null);
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort !== column) return <span className="text-gray-300 ml-1">↕</span>;
    return sortOrder === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
  };

  const formatPrice = (price: number | string) => Number(price).toFixed(2);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory</h1>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 cursor-pointer" onClick={() => handleSort('title')}>
                Product <SortIcon column="title" />
              </th>
              <th className="text-left p-3 cursor-pointer" onClick={() => handleSort('wholesale_price')}>
                Wholesale <SortIcon column="wholesale_price" />
              </th>
              <th className="text-left p-3 cursor-pointer" onClick={() => handleSort('retail_price')}>
                Retail <SortIcon column="retail_price" />
              </th>
              <th className="text-left p-3 cursor-pointer" onClick={() => handleSort('stock_qty')}>
                Stock <SortIcon column="stock_qty" />
              </th>
              <th className="text-center p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">Loading inventory...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No products found.</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.id} className={`border-b hover:bg-gray-50 ${p.stock_qty <= LOW_STOCK_THRESHOLD ? 'bg-red-50' : ''}`}>
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      {p.stock_qty <= LOW_STOCK_THRESHOLD && (
                        <span className="flex items-center gap-1 text-red-600 text-xs mt-1">
                          <AlertTriangle size={12} /> Low stock
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">${formatPrice(p.wholesale_price)}</td>
                  <td className="p-3">${formatPrice(p.retail_price)}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      value={p.stock_qty}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) handleStockChange(p.id, val);
                      }}
                      disabled={updatingId === p.id}
                      className="w-20 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {updatingId === p.id && <span className="text-xs text-gray-400 ml-1">Saving...</span>}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      p.status === 'active' ? 'bg-green-100 text-green-800' :
                      p.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-600">Total: {total} products</span>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => fetchInventory(currentPage - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 py-1">Page {currentPage} of {lastPage}</span>
          <button
            disabled={currentPage === lastPage}
            onClick={() => fetchInventory(currentPage + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}