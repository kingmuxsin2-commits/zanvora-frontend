'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';

const LOW_STOCK = 5;

interface InventoryRow {
  id: number;
  title: string;
  wholesale_price: number;
  retail_price: number;
  stock_qty: number;
  sales_count: number;
  total_revenue: number | null;
  last_sale_date: string | null;
  status: string;
  created_at: string;
}

export default function SupplierInventoryPage() {
  const [products, setProducts] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [updatingCells, setUpdatingCells] = useState<Set<string>>(new Set()); // "id-field" keys

  const perPage = 15;

  const fetchInventory = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get('/supplier/inventory', {
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

  const updateField = async (productId: number, field: 'wholesale_price' | 'stock_qty', value: number) => {
    if (value < 0 || isNaN(value)) return;

    const cellKey = `${productId}-${field}`;
    setUpdatingCells(prev => new Set(prev).add(cellKey));

    // Optimistic update
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, [field]: value } : p))
    );

    try {
      if (field === 'stock_qty') {
        await api.put(`/supplier/products/${productId}/stock`, { stock_qty: value });
      } else {
        await api.put(`/supplier/products/${productId}`, { wholesale_price: value });
      }
    } catch {
      // Revert
      fetchInventory(currentPage);
    } finally {
      setUpdatingCells(prev => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }
  };

  const handleCellBlur = (productId: number, field: 'wholesale_price' | 'stock_qty', e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      updateField(productId, field, val);
    }
  };

  const handleCellKeyDown = (productId: number, field: 'wholesale_price' | 'stock_qty', e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const formatPrice = (price: number) => price.toFixed(2);
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort !== column) return <span className="text-gray-300 ml-1">↕</span>;
    return sortOrder === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
  };

  const isUpdating = (productId: number, field: string) => updatingCells.has(`${productId}-${field}`);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Inventory</h1>

      {/* Search */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600 cursor-pointer" onClick={() => handleSort('title')}>
                Product <SortIcon column="title" />
              </th>
              <th className="text-left p-3 font-medium text-gray-600 cursor-pointer" onClick={() => handleSort('wholesale_price')}>
                Wholesale Price <SortIcon column="wholesale_price" />
              </th>
              <th className="text-left p-3 font-medium text-gray-600">
                Retail Price
              </th>
              <th className="text-left p-3 font-medium text-gray-600 cursor-pointer" onClick={() => handleSort('stock_qty')}>
                Stock <SortIcon column="stock_qty" />
              </th>
              <th className="text-left p-3 font-medium text-gray-600 cursor-pointer" onClick={() => handleSort('sales_count')}>
                Sold <SortIcon column="sales_count" />
              </th>
              <th className="text-left p-3 font-medium text-gray-600 cursor-pointer" onClick={() => handleSort('last_sale_date')}>
                Last Sale <SortIcon column="last_sale_date" />
              </th>
              <th className="text-left p-3 font-medium text-gray-600 cursor-pointer" onClick={() => handleSort('total_revenue')}>
                Revenue <SortIcon column="total_revenue" />
              </th>
              <th className="text-left p-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12">Loading inventory...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-500">No products found.</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.id} className={`border-b hover:bg-gray-50 ${p.stock_qty <= LOW_STOCK ? 'bg-red-50' : ''}`}>
                  {/* Product Title */}
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      {p.stock_qty <= LOW_STOCK && (
                        <span className="flex items-center gap-1 text-red-600 text-xs">
                          <AlertTriangle size={12} /> Low stock
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Wholesale Price (editable) */}
                  <td className="p-3">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={Number(p.wholesale_price)}
                        onBlur={(e) => handleCellBlur(p.id, 'wholesale_price', e)}
                        onKeyDown={(e) => handleCellKeyDown(p.id, 'wholesale_price', e)}
                        className={`w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isUpdating(p.id, 'wholesale_price') ? 'bg-gray-100' : ''}`}
                      />
                      {isUpdating(p.id, 'wholesale_price') && (
                        <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 animate-spin text-indigo-600" size={14} />
                      )}
                    </div>
                  </td>

                  {/* Retail Price (read-only) */}
                  <td className="p-3 text-gray-700">${formatPrice(Number(p.retail_price))}</td>

                  {/* Stock (editable) */}
                  <td className="p-3">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        defaultValue={p.stock_qty}
                        onBlur={(e) => handleCellBlur(p.id, 'stock_qty', e)}
                        onKeyDown={(e) => handleCellKeyDown(p.id, 'stock_qty', e)}
                        className={`w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isUpdating(p.id, 'stock_qty') ? 'bg-gray-100' : ''}`}
                      />
                      {isUpdating(p.id, 'stock_qty') && (
                        <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 animate-spin text-indigo-600" size={14} />
                      )}
                    </div>
                  </td>

                  {/* Sold */}
                  <td className="p-3">{p.sales_count}</td>

                  {/* Last Sale Date */}
                  <td className="p-3">{formatDate(p.last_sale_date)}</td>

                  {/* Total Revenue */}
                  <td className="p-3 font-medium">${p.total_revenue ? Number(p.total_revenue).toFixed(2) : '0.00'}</td>

                  {/* Status */}
                  <td className="p-3">
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
        <div className="flex gap-2 items-center">
          <button
            disabled={currentPage === 1}
            onClick={() => fetchInventory(currentPage - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm">Page {currentPage} of {lastPage}</span>
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