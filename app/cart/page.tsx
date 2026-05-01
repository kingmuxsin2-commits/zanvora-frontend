'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getImageUrl } from '@/lib/getImageUrl';   // ✅ shared helper

const USD_TO_SLSH = 12000;

function formatSLSH(usd: number): string {
  return (usd * USD_TO_SLSH).toLocaleString('en-US');
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();

  // Ensure user is authenticated
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Show loading while hydration completes
  if (!hasHydrated || !isAuthenticated) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/" className="text-indigo-600 hover:underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  const isCustomer = user?.role === 'customer';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          {items.map(item => (
            <div key={item.product_id} className="flex gap-4 border-b pb-4">
              <div className="w-24 h-24 relative bg-gray-100 rounded">
                {item.image && (
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
              </div>
              <div className="flex-1">
                <Link href={`/product/${item.product_id}`} className="font-semibold hover:underline">
                  {item.title}
                </Link>
                <p className="font-bold">${item.price}</p>
                {isCustomer ? (
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-8 h-8 border rounded flex items-center justify-center"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-8 h-8 border rounded flex items-center justify-center"
                      disabled={item.max_qty !== undefined && item.quantity >= item.max_qty}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="ml-auto text-red-500 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 text-gray-600">
                    <span>Quantity: {item.quantity}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="lg:w-80">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>SLSH {formatSLSH(getSubtotal())}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm text-gray-600">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>SLSH {formatSLSH(getSubtotal())}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Converted at 1 USD = {USD_TO_SLSH.toLocaleString('en-US')} SLSH
            </p>
            {isCustomer && (
              <button
                onClick={() => { window.location.href = '/checkout'; }}
                className="block w-full mt-6 bg-indigo-600 text-white text-center py-3 rounded-lg hover:bg-indigo-700"
              >
                Proceed to Checkout
              </button>
            )}
            {!isCustomer && (
              <p className="mt-4 text-sm text-gray-500 italic text-center">
                You are viewing the cart as a staff member.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}