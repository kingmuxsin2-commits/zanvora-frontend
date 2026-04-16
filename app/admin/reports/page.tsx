'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface SupplierPayout {
  id: number;
  business_name: string;
  email: string;
  payment_details: any;
  total_owed: number;
  paid: boolean; // ✅ new field from backend
}

interface PayoutReport {
  start_date: string;
  end_date: string;
  suppliers: SupplierPayout[];
  total_payout: number;
}

export default function AdminReportsPage() {
  const [report, setReport] = useState<PayoutReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);
  // Track which suppliers have been marked as paid (optimistic UI)
  const [paidSuppliers, setPaidSuppliers] = useState<Set<number>>(new Set());

  const fetchReport = (start?: string, end?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (start) params.append('start_date', start);
    if (end) params.append('end_date', end);

    api.get(`/admin/reports/payout?${params}`)
      .then((res: { data: PayoutReport }) => {
        setReport(res.data);
        // Sync paidSuppliers with backend data
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
      // Optimistically update UI
      setPaidSuppliers(prev => new Set(prev).add(supplierId));
      // No full refresh needed – the total owed remains unchanged
    } catch (error) {
      alert('Failed to mark as paid');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Weekly Payout Report</h1>

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