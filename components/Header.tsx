'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuthStore();

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          Marketplace
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/cart" className="hover:text-indigo-600">
            Cart
          </Link>
          {isAuthenticated ? (
            <>
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
          )}
        </nav>
      </div>
    </header>
  );
}