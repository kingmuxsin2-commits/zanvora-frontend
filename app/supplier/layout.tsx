'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  LogOut, Store, HelpCircle, Menu, X, BarChart2 
} from 'lucide-react';

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isLoading && user) {
      if (user.role !== 'supplier') {
        router.push('/');
        return;
      }
      // Check if supplier is approved
      if (user.supplier && !user.supplier.is_approved) {
        router.push('/supplier/pending');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated) return <div className="p-8">Loading...</div>;
  if (!user?.supplier?.is_approved) return <div className="p-8">Checking approval...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-md
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:block h-full overflow-y-auto
      `}>
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-indigo-600">Supplier Portal</h1>
            <p className="text-sm text-gray-500">{user?.supplier?.business_name}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/supplier" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/supplier/products" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <Package size={20} /> Products
          </Link>
          <Link href="/supplier/orders" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <ShoppingCart size={20} /> Orders
          </Link>
          <Link href="/supplier/earnings" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <BarChart3 size={20} /> Earnings
          </Link>
          <Link href="/supplier/analytics" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <BarChart2 size={20} /> Analytics
          </Link>
          <Link href="/supplier/store" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <Store size={20} /> Store Settings
          </Link>
          <Link href="/supplier/guide" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <HelpCircle size={20} /> Guide
          </Link>
          
          {/* View Marketplace link */}
          <Link href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <Store size={20} /> View Marketplace
          </Link>

          <button onClick={() => { logout(); setSidebarOpen(false); }} className="flex items-center gap-2 p-2 text-red-600 hover:bg-red-50 rounded w-full">
            <LogOut size={20} /> Logout
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden bg-white border-b p-4 flex items-center sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-1 hover:bg-gray-100 rounded">
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-lg font-semibold text-indigo-600">Supplier Portal</h1>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}