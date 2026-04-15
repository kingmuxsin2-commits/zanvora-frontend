'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout, isAuthenticated, hasHydrated } = useAuthStore();
  const totalItems = useCartStore(state => state.getTotalItems());
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Don't render auth-dependent UI until hydration completes
  const showAuth = hasHydrated;

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        {/* Three‑column layout */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              Marketplace
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-lg mx-auto">
            <form onSubmit={handleSearch} className="w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </form>
          </div>

          {/* Right: Navigation */}
          <div className="flex-shrink-0">
            <nav className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
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
                <div className="w-20 h-6 bg-gray-200 animate-pulse rounded" />
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}