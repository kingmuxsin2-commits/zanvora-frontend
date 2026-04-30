'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Package, ShoppingCart, 
  CreditCard, LogOut, BarChart3, Percent, Menu, X, Shield, Store,
  BarChart2
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isLoading && user && !['admin', 'staff'].includes(user.role)) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated) return <div className="p-8">Loading...</div>;

  const isAdmin = user?.role === 'admin';
  const portalTitle = isAdmin ? 'ZanVora Admin' : 'Staff Portal';

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white shadow-md
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:block
        h-full overflow-y-auto
      `}>
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600">{portalTitle}</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/admin/suppliers" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <Users size={20} /> Suppliers
          </Link>
          <Link href="/admin/products" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <Package size={20} /> Products
          </Link>
          <Link href="/admin/orders" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <ShoppingCart size={20} /> Orders
          </Link>
          <Link href="/admin/payments" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <CreditCard size={20} /> Payments
          </Link>
          
          {/* Reports - visible to both admin and staff */}
          <Link href="/admin/reports" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <BarChart3 size={20} /> Reports
          </Link>

          {/* View Marketplace - visible to both admin and staff */}
          <Link href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <Store size={20} /> View Marketplace
          </Link>

          {/* Admin-only links */}
          {isAdmin && (
            <>
              <Link href="/admin/commission" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
                <Percent size={20} /> Commission
              </Link>
              <Link href="/admin/admins" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
                <Shield size={20} /> Admins
              </Link>
              <Link href="/admin/analytics" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
                <BarChart2 size={20} /> Analytics
              </Link>
            </>
          )}

          <button onClick={() => { logout(); setSidebarOpen(false); }} className="flex items-center gap-2 p-2 text-red-600 hover:bg-red-50 rounded w-full">
            <LogOut size={20} /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden bg-white border-b p-4 flex items-center sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-1 hover:bg-gray-100 rounded">
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-lg font-semibold text-indigo-600">{portalTitle}</h1>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}