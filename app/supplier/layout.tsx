'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3,
  LogOut,
  Store
} from 'lucide-react';

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isLoading && user && user.role !== 'supplier') {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-sm">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-indigo-600">Supplier Portal</h1>
          <p className="text-sm text-gray-500">{user?.supplier?.business_name}</p>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/supplier" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/supplier/products" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <Package size={20} /> Products
          </Link>
          <Link href="/supplier/orders" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <ShoppingCart size={20} /> Orders
          </Link>
          <Link href="/supplier/earnings" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <BarChart3 size={20} /> Earnings
          </Link>
          <Link href="/supplier/store" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <Store size={20} /> Store Settings
          </Link>
          <button 
            onClick={logout} 
            className="flex items-center gap-2 p-2 text-red-600 hover:bg-red-50 rounded w-full"
          >
            <LogOut size={20} /> Logout
          </button>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}