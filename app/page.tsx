'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getProducts, Product, ProductListResponse } from '@/lib/api/products';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useSearchParams } from 'next/navigation';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const addItem = useCartStore(state => state.addItem);
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const search = searchParams.get('search');

  const [sort, setSort] = useState('newest');
  const [perPage] = useState(12);

  const isCustomer = user?.role === 'customer';

  const { products: recentProducts, loading: recentLoading } = useRecentlyViewed();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchProducts = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    const currentPage = reset ? 1 : page;
    const params: any = { per_page: perPage, page: currentPage, sort };
    if (search) params.search = search;

    try {
      const res: ProductListResponse = await getProducts(params);
      const newProducts: Product[] = res.data || [];

      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      const lastPage = res.meta?.last_page || 1;
      setHasMore(currentPage < lastPage);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, perPage, sort, search]);

  useEffect(() => {
    fetchProducts(true);
  }, [sort, search]);

  useEffect(() => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchProducts(false);
      }
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loading, loadingMore, hasMore, fetchProducts]);

  const handleQuickAdd = (product: Product) => {
    if (!isCustomer) return;
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

  const renderProductCard = (product: Product) => (
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
        
        <div className="flex items-center gap-1 mt-1">
          <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star}>
                {star <= Math.floor(product.average_rating || 0) ? '★' : '☆'}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-500">({product.total_reviews || 0})</span>
        </div>

        <p className="text-lg font-bold mt-1">${product.retail_price}</p>
        {isCustomer ? (
          <button
            onClick={() => handleQuickAdd(product)}
            className="w-full mt-3 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 text-sm"
          >
            Add to Cart
          </button>
        ) : (
          <div className="w-full mt-3 py-2 text-center text-sm text-gray-400 border border-dashed rounded">
            Sign in as customer
          </div>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center">Loading products...</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">
        {search ? `Search results for "${search}"` : 'Marketplace'}
      </h1>

      {!recentLoading && recentProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentProducts.map(product => renderProductCard(product))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Sort by</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border rounded bg-white"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="best_selling">Best Selling</option>
          </select>
        </div>

        {sort !== 'newest' && (
          <button
            onClick={() => setSort('newest')}
            className="px-4 py-2 text-indigo-600 hover:underline h-10"
          >
            Reset
          </button>
        )}
      </div>

      {products.length === 0 && !loading ? (
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
          {products.map(product => renderProductCard(product))}
        </div>
      )}

      <div ref={loadMoreRef} className="py-4 text-center">
        {loadingMore && <p>Loading more products...</p>}
        {!hasMore && products.length > 0 && (
          <p className="text-gray-500">No more products</p>
        )}
      </div>
    </main>
  );
}