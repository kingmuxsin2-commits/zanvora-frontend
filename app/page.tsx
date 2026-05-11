'use client';

import { Suspense } from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getProducts, Product, ProductListResponse } from '@/lib/api/products';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useSearchParams } from 'next/navigation';
import { getImageUrl } from '@/lib/getImageUrl';

// Inner component that actually uses useSearchParams – must be wrapped in Suspense
function HomePageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);
  const triggerCartJump = useCartStore(state => state.triggerCartJump);
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const search = searchParams.get('search');

  const [addedProducts, setAddedProducts] = useState<Set<number>>(new Set());

  const perPage = 200;
  const isCustomer = user?.role === 'customer';

  const fetchProducts = async () => {
    setLoading(true);
    const params: any = { per_page: perPage, page: 1, sort: 'random' };
    if (search) params.search = search;

    try {
      const res: ProductListResponse = await getProducts(params);
      setProducts(res.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

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

    triggerCartJump();

    setAddedProducts(prev => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  // ───── Infinite‑loop Carousel (transparent, navy shadow, gold ring) ─────
  const ProductCarousel = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const [paused, setPaused] = useState(false);

    const carouselItems = products
      .filter(p => p.images?.[0])
      .map(p => ({ id: p.id, image: p.images[0] }));

    if (carouselItems.length === 0) return null;

    const items = [...carouselItems, ...carouselItems, ...carouselItems, ...carouselItems];

    const scroll = useCallback(() => {
      const el = scrollRef.current;
      if (!el || paused) return;
      el.scrollLeft += 1;
      if (el.scrollLeft >= (el.scrollWidth * 2) / 4) {
        el.scrollLeft -= el.scrollWidth / 4;
      }
      animationRef.current = requestAnimationFrame(scroll);
    }, [paused]);

    useEffect(() => {
      animationRef.current = requestAnimationFrame(scroll);
      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }, [scroll]);

    return (
      <div
        className="relative mb-6 py-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={scrollRef}
          className="flex gap-3 px-4 overflow-x-auto scrollbar-hide"
          style={{ scrollBehavior: 'auto' }}
        >
          {items.map((item, idx) => (
            <Link
              key={`${item.id}-${idx}`}
              href={`/product/${item.id}`}
              className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-yellow-500 hover:border-yellow-300 transition-colors
                         shadow-[0_0_8px_rgba(26,47,79,0.4)] hover:shadow-[0_0_12px_rgba(26,47,79,0.6)]"
            >
              <img
                src={getImageUrl(item.image)}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            </Link>
          ))}
        </div>
      </div>
    );
  };

  // ───── Compact Product Card (with cart‑icon notification) ─────
  const renderProductCard = (product: Product) => {
    const showAdded = addedProducts.has(product.id);

    return (
      <div
        key={product.id}
        className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden relative"
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

          {/* Notification overlay with shopping‑bag icon */}
          {showAdded && (
            <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-indigo-600 mb-2"
                >
                  <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <p className="text-sm font-medium text-gray-800">
                  Dalabkaagu wuuxu tagay salada
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading products...</div>;

  return (
    <main className="container mx-auto px-4 py-8 relative">
      {/* Gold doodle background */}
      <style>{`
        .whatsapp-bg {
          background-color: #ffffff;
          background-image: url("data:image/svg+xml,%3Csvg width='280' height='280' viewBox='0 0 280 280' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fbbf24' fill-opacity='0.50'%3E%3Ccircle cx='20' cy='20' r='4'/%3E%3Ccircle cx='80' cy='60' r='3'/%3E%3Ccircle cx='140' cy='30' r='5'/%3E%3Ccircle cx='200' cy='80' r='3'/%3E%3Ccircle cx='260' cy='40' r='4'/%3E%3Cpath d='M40 100l4-8 4 8-8 2 8 2-4 8-4-8-8-2 8-2z'/%3E%3Cpath d='M120 120l6-12 6 12-12 3 12 3-6 12-6-12-12-3 12-3z'/%3E%3Cpath d='M200 90l5-10 5 10-10 3 10 3-5 10-5-10-10-3 10-3z'/%3E%3Ccircle cx='60' cy='180' r='4'/%3E%3Ccircle cx='150' cy='200' r='5'/%3E%3Ccircle cx='240' cy='170' r='3'/%3E%3Cpath d='M100 240l4-8 4 8-8 2 8 2-4 8-4-8-8-2 8-2z'/%3E%3Cpath d='M180 260l6-12 6 12-12 3 12 3-6 12-6-12-12-3 12-3z'/%3E%3Cpath d='M30 260l5-10 5 10-10 3 10 3-5 10-5-10-10-3 10-3z'/%3E%3Ccircle cx='250' cy='240' r='4'/%3E%3C/g%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 280px 280px;
        }
      `}</style>
      <div className="absolute inset-0 whatsapp-bg pointer-events-none" />

      <div className="relative z-10">
        <ProductCarousel />

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map(product => renderProductCard(product))}
          </div>
        )}
      </div>
    </main>
  );
}

// New default export – wraps the content component in Suspense
export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading marketplace…</div>}>
      <HomePageContent />
    </Suspense>
  );
}