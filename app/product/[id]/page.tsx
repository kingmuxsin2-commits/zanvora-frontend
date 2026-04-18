'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProduct, Product } from '@/lib/api/products';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import Link from 'next/link';
import api from '@/lib/api';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://marketplace-api.test';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const { user } = useAuthStore();
  const { addProduct } = useRecentlyViewed();

  // Rating states
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const isCustomer = user?.role === 'customer';

  // ✅ CRITICAL FIX: Stable reference to addProduct to prevent infinite loops.
  // We call addProduct directly inside the effect without making it a dependency.
  useEffect(() => {
    if (!id) return;
    
    // Reset state when ID changes
    setLoading(true);
    setProduct(null);

    getProduct(Number(id))
      .then((response) => {
        // Use the same robust logic as the old code: check for .data wrapper
        const productData = (response as any).data ?? response;
        setProduct(productData as Product);
        // Record recently viewed (does not trigger re-render)
        addProduct(productData.id);
      })
      .catch((err) => {
        console.error('Failed to load product:', err);
        setProduct(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]); // ✅ ONLY depends on ID. This is the key to stability.

  const handleAddToCart = () => {
    if (!product || !isCustomer) return;
    addItem(
      {
        product_id: product.id,
        title: product.title,
        price: product.retail_price,
        image: product.images?.[0] || '',
        supplier_id: product.supplier?.id || 0,
        supplier_name: product.supplier?.business_name || 'Unknown',
        max_qty: product.stock_qty,
      },
      quantity
    );
    router.push('/cart');
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRating || !product) return;

    setSubmitting(true);
    try {
      await api.post(`/products/${product.id}/rate`, {
        rating: userRating,
        review: review.trim() || undefined,
      });
      // Refresh product data after rating
      const response = await getProduct(product.id);
      const refreshed = (response as any).data ?? response;
      setProduct(refreshed as Product);
      setShowRatingForm(false);
      setUserRating(0);
      setReview('');
      alert('Thank you for your review!');
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BACKEND_URL}${path}`;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Product not found</p>
        <Link href="/" className="text-indigo-600 hover:underline mt-2 inline-block">
          Return to marketplace
        </Link>
      </div>
    );
  }

  const avgRating = product.average_rating ?? 0;
  const totalReviews = product.total_reviews ?? 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* ✅ Fixed Image: Using standard <img> to avoid Next.js 400 errors */}
        <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={getImageUrl(product.images[0])}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
          <p className="text-gray-600 mb-4">
            Sold by {product.supplier?.business_name || 'Unknown'}
          </p>

          {/* Rating Display */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-400 text-xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star}>
                  {star <= Math.floor(avgRating) ? '★' : '☆'}
                </span>
              ))}
            </div>
            <span className="text-gray-600">
              {avgRating > 0
                ? `${avgRating.toFixed(1)} (${totalReviews} review${
                    totalReviews !== 1 ? 's' : ''
                  })`
                : 'No reviews yet'}
            </span>
            {isCustomer && (
              <button
                onClick={() => setShowRatingForm(!showRatingForm)}
                className="text-indigo-600 text-sm hover:underline ml-2"
              >
                Write a review
              </button>
            )}
          </div>

          <p className="text-2xl font-bold mb-6">${product.retail_price}</p>
          <p className="mb-4">{product.description}</p>

          {isCustomer ? (
            <>
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
                disabled={product.stock_qty < 1}
                className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock_qty < 1 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-600 mb-2">
                {user
                  ? 'This account cannot make purchases.'
                  : 'Sign in to purchase this product.'}
              </p>
              {!user && (
                <Link href="/login" className="text-indigo-600 hover:underline">
                  Go to Login
                </Link>
              )}
            </div>
          )}

          {/* Rating Submission Form */}
          {showRatingForm && isCustomer && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Write a Review</h3>
              <form onSubmit={handleSubmitRating} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <div className="flex text-2xl gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none"
                      >
                        <span
                          className={
                            star <= (hoverRating || userRating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Review (optional)
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="Share your experience with this product..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting || !userRating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRatingForm(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}