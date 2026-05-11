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
  const cartJump = useCartStore(state => state.cartJump);   // ✅ cart jump state
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const showAuth = hasHydrated;
  const isCustomer = user?.role === 'customer';

  // WhatsApp configuration – replace with your actual number
  const waNumber = '252639204840'; // example
  const waMessage = encodeURIComponent('Hello! I need help with an order.');

  return (
    <header className="border-b border-yellow-500/30 bg-[#1A2F4F] text-yellow-500 sticky top-0 z-40">
      {/* Shine animation for gold elements + THREE‑BUMP CART JUMP */}
      <style>{`
        @keyframes shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .gold-shine {
          background: linear-gradient(90deg,
            #fbbf24 0%,
            #f59e0b 20%,
            #fff7e0 40%,
            #fbbf24 60%,
            #f59e0b 80%,
            #fbbf24 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shine 3s linear infinite;
          font-weight: 700;
        }
        .gold-shine-icon {
          filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5));
          animation: pulse-gold 2s ease-in-out infinite;
        }
        @keyframes pulse-gold {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }

        /* Three gentle jumps for the cart icon (1.2s) */
        @keyframes cart-bounce {
          0%, 100% { transform: translateY(0); }
          10%, 30% { transform: translateY(-10px); }
          20%, 40% { transform: translateY(0); }
          50%, 70% { transform: translateY(-6px); }
          60%, 80% { transform: translateY(0); }
          90% { transform: translateY(-3px); }
        }
        .animate-cart-bounce {
          animation: cart-bounce 1.2s ease;
        }
      `}</style>

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Left: Logo + Text */}
          <div className="flex-shrink-0 flex items-center gap-2 mr-auto">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="40%" stopColor="#fff7e0" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <circle cx="24" cy="24" r="22" stroke="url(#goldGradient)" strokeWidth="2.5" fill="none" />
              <line x1="4" y1="13" x2="12" y2="13" stroke="url(#goldGradient)" strokeWidth="2.5" strokeLinecap="round" />
              <path
                d="M12 13 L12 30 L38 32 L38 18"
                stroke="url(#goldGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="18" cy="38" r="3" stroke="url(#goldGradient)" strokeWidth="2" fill="none" />
              <circle cx="32" cy="38" r="3" stroke="url(#goldGradient)" strokeWidth="2" fill="none" />
              <path
                d="M18 20 L32 20 L18 26 L32 26"
                stroke="url(#goldGradient)"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <div className="leading-tight mt-1">
              <Link href="/" className="text-xl font-bold gold-shine block">
                Zanvora
              </Link>
              <span className="text-xs tracking-[0.2em] gold-shine block" style={{ fontSize: '0.65rem', letterSpacing: '0.2em' }}>
                — STORE —
              </span>
            </div>
          </div>

          {/* Center: single nav item */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-yellow-400/90">
            <Link href="/" className="hover:text-yellow-300 transition">
              All Products
            </Link>
          </nav>

          {/* Right: Search + Cart + User + WhatsApp */}
          <div className="flex items-center gap-4">
            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 pl-4 pr-10 py-2 rounded-full bg-yellow-500/20 text-yellow-200 placeholder-yellow-300/70 border border-yellow-500/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/60 text-sm"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 hover:text-yellow-300">
                <Search size={18} />
              </button>
            </form>

            {/* Desktop WhatsApp – Gold Shimmering Link */}
            <a
              href={`https://wa.me/${waNumber}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium gold-shine transition-all hover:scale-105"
              title="Chat on WhatsApp"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="gold-shine-icon"
              >
                <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* Desktop Navigation (auth) */}
            <div className="hidden md:flex flex-shrink-0">
              <nav className="flex items-center gap-3 flex-wrap justify-end text-yellow-400 text-sm">
                {isCustomer && (
                  <Link
                    href="/cart"
                    className={`hover:text-yellow-300 relative ${cartJump ? 'animate-cart-bounce' : ''}`}
                  >
                    <ShoppingBag size={20} />
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-yellow-500 text-[#0b1c2c] text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                )}
                {isCustomer && (
                  <Link href="/orders" className="hover:text-yellow-300" title="My Orders">
                    <Package size={20} />
                  </Link>
                )}
                {showAuth ? (
                  isAuthenticated ? (
                    <>
                      {user?.role === 'admin' && (
                        <Link href="/admin" className="text-yellow-300 font-medium hover:underline">
                          Admin
                        </Link>
                      )}
                      {user?.role === 'staff' && (
                        <Link href="/admin" className="text-yellow-300 font-medium hover:underline">
                          Staff Portal
                        </Link>
                      )}
                      {user?.role === 'supplier' && (
                        <Link href="/supplier" className="text-yellow-300 font-medium hover:underline">
                          Supplier Portal
                        </Link>
                      )}
                      <span className="text-yellow-400/80">Hi, {user?.name}</span>
                      <button onClick={logout} className="text-yellow-400/80 hover:text-yellow-300 hover:underline">
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="hover:text-yellow-300">
                        Login
                      </Link>
                      <Link href="/register" className="bg-yellow-500 text-[#0b1c2c] px-4 py-1.5 rounded-full hover:bg-yellow-400 transition">
                        Register
                      </Link>
                    </>
                  )
                ) : (
                  <div className="w-20 h-6 bg-yellow-500/20 animate-pulse rounded" />
                )}
              </nav>
            </div>

            {/* Mobile: cart + orders + hamburger + WhatsApp (no search toggle) */}
            <div className="flex items-center gap-2 md:hidden">
              {isCustomer && (
                <Link
                  href="/cart"
                  className={`text-yellow-400 hover:text-yellow-300 relative p-1 ${cartJump ? 'animate-cart-bounce' : ''}`}
                >
                  <ShoppingBag size={20} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-[#0b1c2c] text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}
              {isCustomer && (
                <Link href="/orders" className="text-yellow-400 hover:text-yellow-300 p-1" title="My Orders">
                  <Package size={20} />
                </Link>
              )}
              {/* Mobile WhatsApp */}
              <a
                href={`https://wa.me/${waNumber}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-yellow-400 hover:text-yellow-300"
                title="Chat on WhatsApp"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                </svg>
              </a>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1 text-yellow-400 hover:text-yellow-300"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Input – always visible, icon inside */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearch} className="relative">
            <input
              ref={mobileSearchInputRef}
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-full bg-yellow-500/20 text-yellow-200 placeholder-yellow-300/70 border border-yellow-500/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/60"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 hover:text-yellow-300">
              <Search size={18} />
            </button>
          </form>
        </div>
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