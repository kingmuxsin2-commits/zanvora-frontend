'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const { user, logout, isAuthenticated, hasHydrated } = useAuthStore();
  const totalItems = useCartStore(state => state.getTotalItems());
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const showAuth = hasHydrated;

  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        {/* Three‑column layout */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              Marketplace
            </Link>
          </div>

          {/* Center: Search Bar (hidden on mobile) */}
          <div className="hidden md:block flex-1 max-w-lg mx-auto">
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

          {/* Right: Desktop Navigation (hidden on mobile) */}
          <div className="hidden md:flex flex-shrink-0">
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

          {/* Mobile: Cart icon + Hamburger button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/cart" className="hover:text-indigo-600 relative p-1">
              Cart
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (visible below header on small screens) */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 md:hidden transform transition-transform duration-200 ease-in-out">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-indigo-600">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="p-4 space-y-3">
              {showAuth ? (
                isAuthenticated ? (
                  <>
                    {user?.role === 'customer' && (
                      <Link
                        href="/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 hover:text-indigo-600"
                      >
                        My Orders
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 text-indigo-600 font-medium"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    {user?.role === 'supplier' && (
                      <Link
                        href="/supplier"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 text-indigo-600 font-medium"
                      >
                        Supplier Portal
                      </Link>
                    )}
                    <div className="py-2 text-gray-600">Hi, {user?.name}</div>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 text-red-600 hover:underline"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 hover:text-indigo-600"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 hover:text-indigo-600"
                    >
                      Register
                    </Link>
                  </>
                )
              ) : (
                <div className="py-2 text-gray-400">Loading...</div>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}