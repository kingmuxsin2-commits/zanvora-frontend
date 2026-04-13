'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api'; // ✅ Use our pre-configured Axios instance

const addressSchema = z.object({
  name: z.string().min(1, 'Name required'),
  phone: z.string().min(1, 'Phone required'),
  address_line1: z.string().min(1, 'Address required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City required'),
  postal_code: z.string().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
  const { items, getSubtotal, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items.length, router]);

  const onSubmit = async (data: AddressForm) => {
    setIsSubmitting(true);
    setError('');
    try {
      const orderData = {
        shipping_address: {
          name: data.name,
          phone: data.phone,
          address: data.address_line1 + (data.address_line2 ? ', ' + data.address_line2 : ''),
          city: data.city,
          postal_code: data.postal_code || '',
        },
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      // Use Axios instead of fetch – credentials are automatically included
      const response = await api.post('/orders', orderData);
      const order = response.data;

      clearCart();
      router.push(`/order/${order.id}/payment`);
    } catch (err: any) {
      console.error('Order error:', err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Please <Link href="/login" className="text-indigo-600">login</Link> to continue checkout.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input {...register('name')} className="w-full px-3 py-2 border rounded" />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input {...register('phone')} className="w-full px-3 py-2 border rounded" />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address Line 1</label>
              <input {...register('address_line1')} className="w-full px-3 py-2 border rounded" />
              {errors.address_line1 && <p className="text-red-500 text-sm">{errors.address_line1.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address Line 2 (Optional)</label>
              <input {...register('address_line2')} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input {...register('city')} className="w-full px-3 py-2 border rounded" />
                {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Postal Code</label>
                <input {...register('postal_code')} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span>{item.title} x {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 font-bold flex justify-between">
              <span>Total</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Placing order...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}