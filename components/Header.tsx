'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Search, ShoppingBag, Package } from 'lucide-react';

export default function Header() {
  const { user, logout, isAuthenticated, hasHydrated } = useAuthStore();
  const totalItems = useCartStore(state => state.getTotalItems());
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  const toggleMobileSearch = () => {
    setMobileSearchOpen(prev => !prev);
    if (!mobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
    }
  };

  const showAuth = hasHydrated;
  const isCustomer = user?.role === 'customer';

  return (
    <header className="bg-indigo-600 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-white tracking-tight">
              Zanvora Stores
            </Link>
          </div>

          {/* Center: single nav item */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/90">
            <Link href="/" className="hover:text-white transition">
              All Products
            </Link>
          </nav>

          {/* Right: Search + Cart + User */}
          <div className="flex items-center gap-4">
            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 pl-4 pr-10 py-2 rounded-full bg-white/20 text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white">
                <Search size={18} />
              </button>
            </form>

            {/* Desktop Navigation (auth) */}
            <div className="hidden md:flex flex-shrink-0">
              <nav className="flex items-center gap-3 flex-wrap justify-end text-white/90 text-sm">
                {isCustomer && (
                  <Link href="/cart" className="hover:text-white relative">
                    <ShoppingBag size={20} />
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-white text-indigo-600 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                )}
                {isCustomer && (
                  <Link href="/orders" className="hover:text-white" title="My Orders">
                    <Package size={20} />
                  </Link>
                )}
                {showAuth ? (
                  isAuthenticated ? (
                    <>
                      {user?.role === 'admin' && (
                        <Link href="/admin" className="text-white font-medium hover:underline">
                          Admin
                        </Link>
                      )}
                      {user?.role === 'staff' && (
                        <Link href="/admin" className="text-white font-medium hover:underline">
                          Staff Portal
                        </Link>
                      )}
                      {user?.role === 'supplier' && (
                        <Link href="/supplier" className="text-white font-medium hover:underline">
                          Supplier Portal
                        </Link>
                      )}
                      <span className="text-white/80">Hi, {user?.name}</span>
                      <button onClick={logout} className="text-white/80 hover:text-white hover:underline">
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="hover:text-white">
                        Login
                      </Link>
                      <Link href="/register" className="bg-white text-indigo-600 px-4 py-1.5 rounded-full hover:bg-indigo-50 transition">
                        Register
                      </Link>
                    </>
                  )
                ) : (
                  <div className="w-20 h-6 bg-white/20 animate-pulse rounded" />
                )}
              </nav>
            </div>

            {/* Mobile: search icon + cart + orders + hamburger */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={toggleMobileSearch}
                className="p-2 text-white/80 hover:text-white"
                aria-label="Toggle search"
              >
                <Search size={20} />
              </button>
              {isCustomer && (
                <Link href="/cart" className="text-white/80 hover:text-white relative p-1">
                  <ShoppingBag size={20} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-indigo-600 text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}
              {isCustomer && (
                <Link href="/orders" className="text-white/80 hover:text-white p-1" title="My Orders">
                  <Package size={20} />
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1 text-white/80 hover:text-white"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Input */}
        {mobileSearchOpen && (
          <div className="mt-3 md:hidden">
            <form onSubmit={handleSearch}>
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 md:hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-indigo-600">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <nav className="p-4 space-y-3 text-gray-700">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 hover:text-indigo-600"
              >
                All Products
              </Link>
              <div className="border-t pt-3">
                {showAuth ? (
                  isAuthenticated ? (
                    <>
                      {user?.role === 'customer' && (
                        <>
                          <Link
                            href="/cart"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-2 hover:text-indigo-600"
                          >
                            Cart {totalItems > 0 && `(${totalItems})`}
                          </Link>
                          <Link
                            href="/orders"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-2 hover:text-indigo-600"
                          >
                            My Orders
                          </Link>
                        </>
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
                      {user?.role === 'staff' && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2 text-indigo-600 font-medium"
                        >
                          Staff Portal
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
                  <div className="py-2 text-gray-400">Loading…</div>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}