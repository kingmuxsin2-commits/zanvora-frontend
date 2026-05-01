'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getProducts, Product, ProductListResponse } from '@/lib/api/products';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useSearchParams } from 'next/navigation';
import { getImageUrl } from '@/lib/getImageUrl';           // ✅ shared helper

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

  // ───── Compact Product Card with short description ─────
  const renderProductCard = (product: Product) => (
    <div
      key={product.id}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
    >
      <Link href={`/product/${product.id}`}>
        <div className="aspect-[3/4] relative bg-gray-100">
          {product.images?.[0] ? (
            <img
              src={getImageUrl(product.images[0])}
              alt={product.title}
              className="w-full h-full object-cover"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              No image
            </div>
          )}
        </div>
      </Link>
      <div className="p-2">
        <Link
          href={`/product/${product.id}`}
          className="text-xs font-medium line-clamp-2 hover:text-indigo-600 text-gray-800"
        >
          {product.title}
        </Link>

        {/* Star Ratings */}
        <div className="flex items-center gap-1 mt-1">
          <div className="flex text-yellow-400 text-xs">
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star}>
                {star <= Math.floor(product.average_rating || 0) ? '★' : '☆'}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-500">({product.total_reviews || 0})</span>
        </div>

        {/* Short description (first bullet point) */}
        {product.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {product.description.split(/\n|\.\s+/)[0]}
          </p>
        )}

        <p className="text-sm font-bold mt-1">${product.retail_price}</p>

        {isCustomer ? (
          <button
            onClick={() => handleQuickAdd(product)}
            className="w-full mt-2 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
           Hadda Dalbo
          </button>
        ) : (
          <div className="w-full mt-2 py-1.5 text-xs text-center text-gray-400 border border-dashed rounded">
            Sign in
          </div>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center">Loading products...</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">
        
      </h1>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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