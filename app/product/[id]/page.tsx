'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProduct, Product } from '@/lib/api/products';
import { useCartStore } from '@/stores/cartStore';
import Image from 'next/image';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(state => state.addItem);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      getProduct(Number(id))
        .then((response) => {
          // Handle both { data: Product } and direct Product response
          const productData = (response as any).data ?? response;
          setProduct(productData as Product);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      product_id: product.id,
      title: product.title,
      price: product.retail_price,
      image: product.images?.[0] || '',
      supplier_id: product.supplier.id,
      supplier_name: product.supplier.business_name,
      max_qty: product.stock_qty,
    }, quantity);
    router.push('/cart');
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!product) return <div className="p-8">Product not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
          {product.images?.[0] && (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-contain"
            />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
          <p className="text-gray-600 mb-4">Sold by {product.supplier.business_name}</p>
          <p className="text-2xl font-bold mb-6">${product.retail_price}</p>
          <p className="mb-4">{product.description}</p>
          <div className="flex items-center gap-4 mb-6">
            <label className="font-medium">Quantity:</label>
            <input
              type="number"
              min="1"
              max={product.stock_qty}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border rounded"
            />
            <span className="text-sm text-gray-500">
              {product.stock_qty} available
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}