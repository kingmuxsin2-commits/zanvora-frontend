'use client';

import { useEffect, useState } from 'react';
import { getProducts, Product } from '@/lib/api/products';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { useSearchParams } from 'next/navigation';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);
  const searchParams = useSearchParams();
  const search = searchParams.get('search');

  useEffect(() => {
    getProducts(search ? { search } : undefined)
      .then((res: any) => {
        const productData = res.data?.data || res.data || res;
        setProducts(Array.isArray(productData) ? productData : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  const handleQuickAdd = (product: Product) => {
    addItem({
      product_id: product.id,
      title: product.title,
      price: product.retail_price,
      image: product.images?.[0] || '',
      supplier_id: product.supplier.id,
      supplier_name: product.supplier.business_name,
      max_qty: product.stock_qty,
    }, 1);
  };

  if (loading) return <div className="p-8 text-center">Loading products...</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {search ? `Search results for "${search}"` : 'Marketplace'}
      </h1>
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found.</p>
          {search && (
            <Link href="/" className="text-indigo-600 hover:underline mt-2 inline-block">
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <Link href={`/product/${product.id}`}>
                <div className="aspect-square relative bg-gray-100">
                  {product.images?.[0] && (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </Link>
              <div className="p-3">
                <Link href={`/product/${product.id}`} className="font-medium line-clamp-2 hover:text-indigo-600">
                  {product.title}
                </Link>
                <p className="text-sm text-gray-500 mt-1">{product.supplier.business_name}</p>
                <p className="text-lg font-bold mt-1">${product.retail_price}</p>
                <button
                  onClick={() => handleQuickAdd(product)}
                  className="w-full mt-3 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 text-sm"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}