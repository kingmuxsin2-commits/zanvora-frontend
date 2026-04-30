'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

// ---------- Types ----------
interface Transaction {
  id: number;
  type: 'purchase' | 'sale';
  product_name: string;
  price: number;
  quantity: number;
  transaction_date: string;
}

interface StockRow {
  product_name: string;
  purchased_qty: number;
  sold_qty: number;
  current_stock: number;
  total_buy_value: number | null;
  total_sell_value: number | null;
}

// ---------- Constants ----------
const TODAY = new Date().toISOString().slice(0, 10);

// ---------- Tabs ----------
const TABS = [
  { key: 'entry', label: 'Daily Entry' },
  { key: 'history', label: 'History' },
  { key: 'stock', label: 'Stock Management' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function SupplierInventoryPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('entry');

  // Entry form
  const [entryType, setEntryType] = useState<'purchase' | 'sale'>('purchase');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [entryDate, setEntryDate] = useState(TODAY);
  const [saving, setSaving] = useState(false);

  // History
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Stock
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [physicalStock, setPhysicalStock] = useState<Record<string, number>>({});

  // ---------- Entry: Add transaction ----------
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !price) return;
    setSaving(true);
    try {
      await api.post('/supplier/inventory/transactions', {
        type: entryType,
        product_name: productName.trim(),
        price: parseFloat(price),
        quantity: parseInt(quantity, 10) || 1,
        transaction_date: entryDate,
      });
      setProductName('');
      setPrice('');
      setQuantity('1');
      setEntryDate(TODAY);
      alert('Transaction saved');
    } catch {
      alert('Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  // ---------- History: Fetch ----------
  const fetchHistory = useCallback(
    async (p: number) => {
      setLoadingHistory(true);
      try {
        const res = await api.get('/supplier/inventory/transactions', {
          params: { page: p, per_page: 15, search },
        });
        setTransactions(res.data.data);
        setPage(res.data.current_page);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
      } finally {
        setLoadingHistory(false);
      }
    },
    [search],
  );

  useEffect(() => {
    if (activeTab === 'history') fetchHistory(1);
  }, [activeTab, fetchHistory]);

  // ---------- Stock: Fetch summary ----------
  const fetchStock = useCallback(async () => {
    setLoadingStock(true);
    try {
      const res = await api.get('/supplier/inventory/stock-summary');
      setStockRows(res.data);
    } finally {
      setLoadingStock(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'stock') fetchStock();
  }, [activeTab, fetchStock]);

  // ---------- Stock: compare physical ----------
  const handlePhysicalChange = (product: string, value: number) => {
    setPhysicalStock(prev => ({ ...prev, [product]: value }));
  };

  // ---------- Delete ----------
  const deleteTransaction = async (id: number) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/supplier/inventory/transactions/${id}`);
      fetchHistory(page);
      if (activeTab === 'stock') fetchStock();
    } catch {
      alert('Failed to delete');
    }
  };

  // Helper: format date safely (strip time part if present)
  const formatDate = (dateStr: string) => (dateStr ? dateStr.split('T')[0] : '');

  // ---------- Render ----------
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Inventory</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
              activeTab === tab.key
                ? 'bg-white text-indigo-600 border border-b-white'
                : 'text-gray-500 hover:text-indigo-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============ TAB 1: DAILY ENTRY ============ */}
      {activeTab === 'entry' && (
        <div className="max-w-lg">
          <h2 className="text-xl font-semibold mb-4">New Transaction</h2>
          <form onSubmit={handleAddTransaction} className="space-y-4 bg-white p-6 rounded-lg shadow">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={entryType}
                onChange={e => setEntryType(e.target.value as 'purchase' | 'sale')}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="purchase">Purchase (Bought)</option>
                <option value="sale">Sale (Sold)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input
                type="text"
                required
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g. T-Shirt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {entryType === 'purchase' ? 'Buy Price' : 'Selling Price'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Transaction'}
            </button>
          </form>
        </div>
      )}

      {/* ============ TAB 2: HISTORY ============ */}
      {activeTab === 'history' && (
        <div>
          <div className="mb-4 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by product name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
            />
          </div>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {loadingHistory ? (
                  <tr><td colSpan={7} className="text-center py-12">Loading...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-500">No transactions found.</td></tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{formatDate(t.transaction_date)}</td>
                      <td className="p-2 capitalize">{t.type}</td>
                      <td className="p-2">{t.product_name}</td>
                      <td className="p-2 text-center">{t.quantity}</td>
                      <td className="p-2 text-right">${Number(t.price).toFixed(2)}</td>
                      <td className="p-2 text-right">${(Number(t.price) * t.quantity).toFixed(2)}</td>
                      <td className="p-2">
                        <button onClick={() => deleteTransaction(t.id)} className="text-red-600 hover:bg-red-50 rounded p-1">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">Total: {total} transactions</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => fetchHistory(page - 1)} className="px-3 py-1 border rounded disabled:opacity-50"><ChevronLeft size={16} /></button>
              <span className="text-sm">Page {page} of {lastPage}</span>
              <button disabled={page >= lastPage} onClick={() => fetchHistory(page + 1)} className="px-3 py-1 border rounded disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 3: STOCK MANAGEMENT ============ */}
      {activeTab === 'stock' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Stock Overview</h2>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-center">Purchased</th>
                  <th className="p-2 text-center">Sold</th>
                  <th className="p-2 text-center">left</th>
                  <th className="p-2 text-center">Physical</th>
                  <th className="p-2 text-center">Difference</th>
                  <th className="p-2 text-right">Buy Value</th>
                  <th className="p-2 text-right">Sell Value</th>
                  <th className="p-2 text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {loadingStock ? (
                  <tr><td colSpan={9} className="text-center py-12">Loading...</td></tr>
                ) : stockRows.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-500">No data.</td></tr>
                ) : (
                  stockRows.map(row => {
                    const physical = physicalStock[row.product_name] !== undefined ? physicalStock[row.product_name] : null;
                    const discrepancy = physical !== null ? physical - row.current_stock : null;
                    const margin =
                      row.total_sell_value != null && row.total_buy_value != null
                        ? (row.total_sell_value - row.total_buy_value).toFixed(2)
                        : '—';
                    return (
                      <tr key={row.product_name} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{row.product_name}</td>
                        <td className="p-2 text-center">{row.purchased_qty}</td>
                        <td className="p-2 text-center">{row.sold_qty}</td>
                        <td className="p-2 text-center">{row.current_stock}</td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            className="w-20 px-2 py-1 border rounded text-center"
                            value={physicalStock[row.product_name] ?? ''}
                            onChange={e => handlePhysicalChange(row.product_name, parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className={`p-2 text-center font-bold ${discrepancy === null ? '' : discrepancy === 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {discrepancy === null ? '—' : discrepancy === 0 ? 'OK' : discrepancy}
                        </td>
                        <td className="p-2 text-right">${row.total_buy_value != null ? Number(row.total_buy_value).toFixed(2) : '0.00'}</td>
                        <td className="p-2 text-right">${row.total_sell_value != null ? Number(row.total_sell_value).toFixed(2) : '0.00'}</td>
                        <td className="p-2 text-right">{margin !== '—' ? `$${margin}` : '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Enter the actual physical stock to compare with the calculated stock from your transactions.
          </p>
        </div>
      )}
    </div>
  );
}