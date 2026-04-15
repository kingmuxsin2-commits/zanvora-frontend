'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard,
  LogOut,
  BarChart3,
  Percent
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isLoading && user && !['admin', 'staff'].includes(user.role)) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - visible on all screens, can scroll if needed */}
      <aside className="w-64 bg-white shadow-sm overflow-y-auto">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-indigo-600">Marketplace Admin</h1>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-sm md:text-base">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/admin/suppliers" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-sm md:text-base">
            <Users size={20} /> Suppliers
          </Link>
          <Link href="/admin/products" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-sm md:text-base">
            <Package size={20} /> Products
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-sm md:text-base">
            <ShoppingCart size={20} /> Orders
          </Link>
          <Link href="/admin/payments" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-sm md:text-base">
            <CreditCard size={20} /> Payments
          </Link>
          <Link href="/admin/commission" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-sm md:text-base">
            <Percent size={20} /> Commission
          </Link>
          <Link href="/admin/reports" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-sm md:text-base">
            <BarChart3 size={20} /> Reports
          </Link>
          <button 
            onClick={logout} 
            className="flex items-center gap-2 p-2 text-red-600 hover:bg-red-50 rounded w-full text-sm md:text-base"
          >
            <LogOut size={20} /> Logout
          </button>
        </nav>
      </aside>
      
      {/* Main content - scrollable, with responsive padding */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}