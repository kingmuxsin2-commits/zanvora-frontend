'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ToggleLeft, ToggleRight, Search } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  last_activity: string | null;
}

interface Supplier {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  business_name: string;
  is_approved: boolean;
  is_active: boolean;
  last_activity: string | null;
}

export default function AdminControlsPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Search states
  const [customerSearch, setCustomerSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');

  // Revealed passwords per user
  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, string>>({});

  const fetchCustomers = () => {
    api.get('/admin/controls/customers')
      .then(res => setCustomers(res.data))
      .catch(console.error);
  };

  const fetchSuppliers = () => {
    api.get('/admin/controls/suppliers')
      .then(res => setSuppliers(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCustomers(), fetchSuppliers()])
      .finally(() => setLoading(false));
  }, []);

  const toggleCustomerActive = async (userId: number) => {
    await api.post(`/admin/controls/users/${userId}/toggle-active`);
    fetchCustomers();
  };

  const toggleSupplierStatus = async (supplierId: number) => {
    await api.post(`/admin/controls/suppliers/${supplierId}/toggle-status`);
    fetchSuppliers();
  };

  const handleResetPassword = async (userId: number) => {
    try {
      const res = await api.post(`/admin/controls/users/${userId}/reset-password`);
      const newPass = res.data.new_password;
      setRevealedPasswords(prev => ({ ...prev, [userId]: newPass }));
      setTimeout(() => {
        setRevealedPasswords(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }, 30000);
      alert(`New password: ${newPass}`);
    } catch {
      alert('Failed to reset password');
    }
  };

  // Filtered arrays
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.phone.includes(supplierSearch) ||
    s.business_name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">User Controls</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'customers' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'
          }`}
        >
          Customers
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'suppliers' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'
          }`}
        >
          Suppliers
        </button>
      </div>

      {/* Customers Table */}
      {activeTab === 'customers' && (
        <div>
          {/* Search Bar for Customers */}
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
            />
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Password</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Last Activity</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{c.name}</td>
                    <td className="p-4">{c.phone}</td>
                    <td className="p-4">{c.email}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResetPassword(c.id)}
                          className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                          title="Reset password"
                        >
                          Reset
                        </button>
                        {revealedPasswords[c.id] && (
                          <span className="text-xs font-mono text-green-700">
                            {revealedPasswords[c.id]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        c.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {c.last_activity ? new Date(c.last_activity).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleCustomerActive(c.id)}
                        className="flex items-center gap-1 text-sm"
                      >
                        {c.is_active ? (
                          <><ToggleRight className="text-green-600" size={20} /> Deactivate</>
                        ) : (
                          <><ToggleLeft className="text-gray-400" size={20} /> Activate</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">No customers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      {activeTab === 'suppliers' && (
        <div>
          {/* Search Bar for Suppliers */}
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, phone or business..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
            />
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">Business</th>
                  <th className="text-left p-4">Contact</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Password</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Last Activity</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{s.business_name}</td>
                    <td className="p-4">{s.name}</td>
                    <td className="p-4">{s.phone}</td>
                    <td className="p-4">{s.email}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResetPassword(s.user_id)}
                          className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                          title="Reset password"
                        >
                          Reset
                        </button>
                        {revealedPasswords[s.user_id] && (
                          <span className="text-xs font-mono text-green-700">
                            {revealedPasswords[s.user_id]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        s.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {s.is_approved ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {s.last_activity ? new Date(s.last_activity).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleSupplierStatus(s.id)}
                        className="flex items-center gap-1 text-sm"
                      >
                        {s.is_approved ? (
                          <><ToggleRight className="text-green-600" size={20} /> Deactivate</>
                        ) : (
                          <><ToggleLeft className="text-gray-400" size={20} /> Activate</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && (
                  <tr><td colSpan={8} className="p-4 text-center text-gray-500">No suppliers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}