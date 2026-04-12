'use client';

import { useEffect, useState } from 'react';
import { getProducts, Product } from '@/lib/api/products';
import Image from 'next/image';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(res => setProducts(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading products...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Featured Products</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
            {product.images[0] && (
              <div className="aspect-square relative bg-gray-100">
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-3">
              <h2 className="font-medium truncate">{product.title}</h2>
              <p className="text-lg font-bold text-indigo-600">${product.retail_price}</p>
              <p className="text-sm text-gray-500">{product.supplier?.business_name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}