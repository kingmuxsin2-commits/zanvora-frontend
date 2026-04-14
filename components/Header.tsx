'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

export default function Header() {
  const { user, logout, isAuthenticated, hasHydrated } = useAuthStore();
  const totalItems = useCartStore(state => state.getTotalItems());

  // Don't render auth-dependent UI until hydration completes
  const showAuth = hasHydrated;

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          Marketplace
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/cart" className="hover:text-indigo-600 relative">
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          {showAuth ? (
            isAuthenticated ? (
              <>
                {user?.role === 'customer' && (
                  <Link href="/orders" className="hover:text-indigo-600">
                    My Orders
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link href="/admin" className="text-indigo-600 font-medium">
                    Admin
                  </Link>
                )}
                {user?.role === 'supplier' && (
                  <Link href="/supplier" className="text-indigo-600 font-medium">
                    Supplier Portal
                  </Link>
                )}
                <span className="text-gray-600">Hi, {user?.name}</span>
                <button onClick={logout} className="text-red-600 hover:underline">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-indigo-600">
                  Login
                </Link>
                <Link href="/register" className="hover:text-indigo-600">
                  Register
                </Link>
              </>
            )
          ) : (
            // Show placeholders while hydrating
            <div className="w-20 h-6 bg-gray-200 animate-pulse rounded" />
          )}
        </nav>
      </div>
    </header>
  );
}