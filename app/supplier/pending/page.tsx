'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function SupplierPendingPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const router = useRouter();

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
      // If already approved, redirect to dashboard
      if (user.supplier?.is_approved) {
        router.push('/supplier');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="text-yellow-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Pending Approval</h1>
        <p className="text-gray-600 mb-6">
          Your supplier account is currently under review. You'll be able to access the Supplier Portal once an admin approves your application.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          This usually takes 1-2 business days. We'll notify you via email when your account is approved.
        </p>
        <button
          onClick={logout}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}