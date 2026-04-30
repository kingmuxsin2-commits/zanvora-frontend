'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface SupplierPayout {
  id: number;
  business_name: string;
  email: string;
  payment_details: any;
  total_owed: number;
  paid: boolean;
}

interface PayoutReport {
  start_date: string;
  end_date: string;
  suppliers: SupplierPayout[];
  total_payout: number;
}

interface PlatformRevenueData {
  period: {
    start: string;
    end: string;
  };
  commission: number;
  subscriptions: number;
  total: number;
}

interface SupplierBreakdownItem {
  supplier_id: number;
  business_name: string;
  total_wholesale: number;
  total_commission: number;
}

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<'payout' | 'platform'>('payout');

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          onClick={() => setActiveTab('payout')}
          className={`pb-2 px-1 ${
            activeTab === 'payout'
              ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Supplier Payouts
        </button>
        <button
          onClick={() => setActiveTab('platform')}
          className={`pb-2 px-1 ${
            activeTab === 'platform'
              ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Platform Revenue
        </button>
      </div>

      {activeTab === 'payout' ? <PayoutReport /> : <PlatformRevenue />}
    </div>
  );
}

// ---------- Supplier Payout Report (existing) ----------
function PayoutReport() {
  const [report, setReport] = useState<PayoutReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);
  const [paidSuppliers, setPaidSuppliers] = useState<Set<number>>(new Set());

  const fetchReport = (start?: string, end?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (start) params.append('start_date', start);
    if (end) params.append('end_date', end);

    api.get(`/admin/reports/payout?${params}`)
      .then((res: { data: PayoutReport }) => {
        setReport(res.data);
        const paidIds = res.data.suppliers.filter(s => s.paid).map(s => s.id);
        setPaidSuppliers(new Set(paidIds));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(startDate, endDate);
  };

  const handleMarkPaid = async (supplierId: number, amount: number) => {
    setProcessing(supplierId);
    try {
      await api.post(`/admin/suppliers/${supplierId}/mark-paid`, { amount });
      setPaidSuppliers(prev => new Set(prev).add(supplierId));
    } catch (error) {
      alert('Failed to mark as paid');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div>
      {/* Date Filter */}
      <form onSubmit={handleFilter} className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Apply Filter
        </button>
      </form>

      {report && (
        <>
          <div className="mb-4 text-gray-600">
            Period: {report.start_date} to {report.end_date}
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">Supplier</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Payment Method</th>
                  <th className="text-right p-4">Total Owed</th>
                  <th className="text-center p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {report.suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No payouts for this period
                    </td>
                  </tr>
                ) : (
                  report.suppliers.map(s => {
                    const isPaid = paidSuppliers.has(s.id);
                    return (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{s.business_name}</td>
                        <td className="p-4">{s.email}</td>
                        <td className="p-4">
                          {s.payment_details?.paypal_email || s.payment_details?.venmo_handle || '—'}
                        </td>
                        <td className="p-4 text-right font-bold">
                          ${s.total_owed.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleMarkPaid(s.id, s.total_owed)}
                            disabled={isPaid || processing === s.id}
                            className={`px-3 py-1 rounded text-sm ${
                              isPaid
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } disabled:opacity-50`}
                          >
                            {isPaid ? 'Paid ✓' : processing === s.id ? 'Processing...' : 'Mark as Paid'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan={3} className="p-4 text-right font-bold">Total Payout:</td>
                  <td className="p-4 text-right font-bold">${report.total_payout.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Platform Revenue Report (with per‑supplier breakdown) ----------
function PlatformRevenue() {
  const [data, setData] = useState<PlatformRevenueData | null>(null);
  const [breakdown, setBreakdown] = useState<SupplierBreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [breakdownLoading, setBreakdownLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = () => {
    setLoading(true);
    setBreakdownLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    Promise.all([
      api.get(`/admin/revenue/platform?${params}`),
      api.get(`/admin/revenue/supplier-breakdown?${params}`)
    ])
      .then(([revenueRes, breakdownRes]) => {
        setData(revenueRes.data);
        setBreakdown(breakdownRes.data);
      })
      .finally(() => {
        setLoading(false);
        setBreakdownLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!data) return null;

  return (
    <div>
      {/* Date Filter */}
      <form onSubmit={handleFilter} className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Apply Filter
        </button>
      </form>

      <div className="mb-4 text-gray-600">
        Period: {data.period.start} to {data.period.end}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Commission Earned</p>
          <p className="text-3xl font-bold text-green-600">${data.commission}</p>
          <p className="text-xs text-gray-400 mt-1">From paid orders</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Subscription Revenue</p>
          <p className="text-3xl font-bold text-blue-600">${data.subscriptions}</p>
          <p className="text-xs text-gray-400 mt-1">Supplier monthly fees</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Total Platform Revenue</p>
          <p className="text-3xl font-bold text-indigo-600">${data.total}</p>
          <p className="text-xs text-gray-400 mt-1">Net platform earnings</p>
        </div>
      </div>

      {/* Per‑Supplier Breakdown */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Supplier Revenue Breakdown</h2>
        {breakdownLoading ? (
          <div className="text-center py-8">Loading breakdown...</div>
        ) : breakdown.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-lg">
            <p className="text-gray-500">No supplier revenue in this period.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">Supplier</th>
                  <th className="text-right p-4">Wholesale Owed</th>
                  <th className="text-right p-4">Platform Commission</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item) => (
                  <tr key={item.supplier_id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{item.business_name}</td>
                    <td className="p-4 text-right">${item.total_wholesale.toFixed(2)}</td>
                    <td className="p-4 text-right text-green-600">${item.total_commission.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td className="p-4 font-bold">Total</td>
                  <td className="p-4 text-right font-bold">
                    ${breakdown.reduce((sum, i) => sum + i.total_wholesale, 0).toFixed(2)}
                  </td>
                  <td className="p-4 text-right font-bold text-green-600">
                    ${breakdown.reduce((sum, i) => sum + i.total_commission, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}