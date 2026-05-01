'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from '@/stores/cartStore';
import Link from 'next/link';
import api from '@/lib/api';

const USD_TO_SLSH = 12000;

function toSLSH(usd: number): number {
  return usd * USD_TO_SLSH;
}

const degmoData: Record<string, string[]> = {
  '26 June': ['Shacabka', 'Beerta Xorriyada', 'India Line', 'Jigjiga Yar'],
  '31 May': ['Pebsiga'],
  'Axmed Dhagax': ['Half London', 'Siinay', 'October'],
  'Macalin Haarun': ['New Hargeisa'],
  'Maxamed Mooge': ['Juungalka'],
  'Maxamuud Haybe': ['Masallaha', 'Xiddigta', 'Jameeco-weyn', 'Calaamada', 'Qudhacdheer'],
};

const addressSchema = z.object({
  name: z.string().min(1, 'Name required'),
  phone: z.string().min(1, 'Phone required'),
  degmo: z.string().min(1, 'Degmada required'),
  xafad: z.string().min(1, 'Xafadda required'),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
  const { items, getSubtotal } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedDegmo, setSelectedDegmo] = useState('');
  const [selectedXafad, setSelectedXafad] = useState('');
  const [deliveryFeeUSD, setDeliveryFeeUSD] = useState(0);

  // Gently pre‑fill name/phone from localStorage (no redirects)
  const [defaultName, setDefaultName] = useState('');
  const [defaultPhone, setDefaultPhone] = useState('');

  const availableXafado = selectedDegmo ? degmoData[selectedDegmo] || [] : [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { name: '', phone: '' },
  });

  // Read name/phone from localStorage on mount (does NOT redirect)
  useEffect(() => {
    try {
      const userJson = window.localStorage.getItem('auth_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setDefaultName(user.name || '');
        setDefaultPhone(user.phone || '');
        setValue('name', user.name || '');
        setValue('phone', user.phone || '');
      }
    } catch {}
  }, [setValue]);

  // Sync dropdowns with form
  useEffect(() => {
    setValue('degmo', selectedDegmo, { shouldValidate: true });
  }, [selectedDegmo, setValue]);

  useEffect(() => {
    setValue('xafad', selectedXafad, { shouldValidate: true });
  }, [selectedXafad, setValue]);

  // Fetch delivery fee
  useEffect(() => {
    if (!selectedXafad) {
      setDeliveryFeeUSD(0);
      return;
    }
    api.get(`/delivery-fee?xafad=${encodeURIComponent(selectedXafad)}`)
      .then(res => setDeliveryFeeUSD(Number(res.data?.price ?? 0)))
      .catch(() => setDeliveryFeeUSD(0));
  }, [selectedXafad]);

  const onSubmit = async (data: AddressForm) => {
    setIsSubmitting(true);
    setError('');
    try {
      const merchandiseSLSH = toSLSH(getSubtotal());
      const deliverySLSH = toSLSH(deliveryFeeUSD);
      const totalSLSH = merchandiseSLSH + deliverySLSH;

      const orderData = {
        shipping_address: {
          name: data.name,
          phone: data.phone,
          address: `${data.degmo} – ${data.xafad}`,
        },
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        total_amount: totalSLSH,
      };

      const response = await api.post('/orders', orderData);
      const order = response.data;

      if (!order.id) throw new Error('Order created but no ID returned');

      // Navigate to payment page immediately
      window.location.href = `/order/payment?orderId=${order.id}`;
    } catch (err: any) {
      console.error('Order error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-6">Add some products before checking out.</p>
        <Link href="/" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const deliverySLSH = toSLSH(deliveryFeeUSD);
  const totalUSD = getSubtotal() + deliveryFeeUSD;
  const totalSLSH = toSLSH(totalUSD);

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
              <label className="block text-sm font-medium mb-1">Degmada *</label>
              <select
                value={selectedDegmo}
                onChange={(e) => { setSelectedDegmo(e.target.value); setSelectedXafad(''); }}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">-- Dooro Degmada --</option>
                {Object.keys(degmoData).map(degmo => (
                  <option key={degmo} value={degmo}>{degmo}</option>
                ))}
              </select>
              {errors.degmo && <p className="text-red-500 text-sm">{errors.degmo.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Xafadda *</label>
              <select
                value={selectedXafad}
                onChange={(e) => setSelectedXafad(e.target.value)}
                disabled={!selectedDegmo}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">-- Dooro Xafadda --</option>
                {availableXafado.map(xafad => (
                  <option key={xafad} value={xafad}>{xafad}</option>
                ))}
              </select>
              {errors.xafad && <p className="text-red-500 text-sm">{errors.xafad.message}</p>}
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
            {deliveryFeeUSD > 0 && (
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>${deliveryFeeUSD.toFixed(2)} (SLSH {deliverySLSH.toLocaleString('en-US')})</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 font-bold flex justify-between">
              <span>Total (SLSH)</span>
              <span>SLSH {totalSLSH.toLocaleString('en-US')}</span>
            </div>
            <div className="text-xs text-gray-500 text-right">≈ ${totalUSD.toFixed(2)}</div>
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