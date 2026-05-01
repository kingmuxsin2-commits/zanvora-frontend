'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProduct, Product } from '@/lib/api/products';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Play, ShieldCheck, Truck, RefreshCw, X, Star,
  Share2, Link2, Check, MessageCircle, ChevronLeft, ChevronRight
} from 'lucide-react';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://marketplace-api.test';

const LOW_STOCK_THRESHOLD = 5;

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
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  // Video modal state
  const [showVideo, setShowVideo] = useState(false);

  // Image gallery state – carousel
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Variant selection state
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [variantImage, setVariantImage] = useState<string | null>(null);

  // Social share state
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const isCustomer = user?.role === 'customer';

  const images = product?.images || [];

  const goTo = (index: number) => {
    setCurrentIndex(index);
  };
  const nextImage = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  };
  const prevImage = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextImage();
      else prevImage();
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setProduct(null);
    getProduct(Number(id))
      .then((response) => {
        const productData = (response as any).data ?? response;
        setProduct(productData as Product);
        addProduct(productData.id);
        const defaults: Record<string, string> = {};
        if (productData.variants) {
          productData.variants.forEach((v: any) => {
            if (v.options?.length) defaults[v.name] = v.options[0].value;
          });
        }
        setSelectedVariants(defaults);
      })
      .catch((err) => {
        console.error('Failed to load product:', err);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product) return;
    let basePrice = Number(product.retail_price);
    let totalStock = product.stock_qty;
    let image = product.images?.[0] || null;

    if (product.variants) {
      product.variants.forEach((variant: any) => {
        const selectedValue = selectedVariants[variant.name];
        if (selectedValue) {
          const option = variant.options?.find((o: any) => o.value === selectedValue);
          if (option) {
            if (option.price_modifier) basePrice += Number(option.price_modifier);
            if (option.stock !== undefined) totalStock = option.stock;
            if (option.image) image = option.image;
          }
        }
      });
    }
    setCurrentPrice(basePrice);
    setCurrentStock(totalStock);
    setVariantImage(image);
  }, [selectedVariants, product]);

  const handleAddToCart = () => {
    if (!product || !isCustomer) return;
    addItem(
      {
        product_id: product.id,
        title: product.title,
        price: currentPrice,
        image: variantImage || product.images?.[0] || '',
        supplier_id: product.supplier?.id || 0,
        supplier_name: product.supplier?.business_name || 'Unknown',
        max_qty: currentStock,
        variants: selectedVariants,
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
      const formData = new FormData();
      formData.append('rating', userRating.toString());
      if (review.trim()) formData.append('review', review.trim());
      if (reviewImage) formData.append('image', reviewImage);
      await api.post(`/products/${product.id}/rate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const response = await getProduct(product.id);
      const refreshed = (response as any).data ?? response;
      setProduct(refreshed as Product);
      setShowRatingForm(false);
      setUserRating(0);
      setReview('');
      setReviewImage(null);
      alert('Thank you for your review!');
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert('You can only review products you have purchased.');
      } else {
        alert('Failed to submit rating. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BACKEND_URL}${path}`;
  };

  const formatDescription = (desc: string | null) => {
    if (!desc) return [];
    return desc.split(/\n|\.\s+/).filter(line => line.trim().length > 0);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out ${product?.title} on ZanVora!`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.title, text: shareText, url: shareUrl });
      } catch {}
    } else {
      setShowShareTooltip(!showShareTooltip);
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const ratings = (product as any)?.ratings || [];

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
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery – Carousel + Thumbnails */}
        <div className="space-y-2">
          <div
            className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {images.length > 0 ? (
              <img
                src={getImageUrl(images[currentIndex])}
                alt={product.title}
                className="w-full h-full object-contain"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {(product as any).video_url && (
              <button
                onClick={() => setShowVideo(true)}
                className="absolute bottom-4 right-4 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition"
                title="Watch video"
              >
                <Play size={20} />
              </button>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`w-16 h-16 border-2 rounded-lg overflow-hidden flex-shrink-0 transition ${
                    idx === currentIndex
                      ? 'border-indigo-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>

          {/* Rating Display + Share Button */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
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
            </div>
            <div className="relative ml-auto">
              <button
                onClick={handleShare}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                title="Share"
              >
                <Share2 size={20} className="text-gray-600" />
              </button>
              {showShareTooltip && (
                <div className="absolute right-0 top-full mt-2 bg-white shadow-lg rounded-lg p-3 z-50 w-48 border">
                  <div className="flex gap-2 justify-around">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 rounded-full text-green-600"
                      title="WhatsApp"
                    >
                      <MessageCircle size={20} />
                    </a>
                    <a
                      href={`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 rounded-full text-blue-600"
                      title="Facebook"
                    >
                      <span className="font-bold text-lg">f</span>
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 rounded-full text-sky-500"
                      title="Twitter"
                    >
                      <span className="font-bold text-lg">𝕏</span>
                    </a>
                    <button
                      onClick={copyLink}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-600 relative"
                      title="Copy link"
                    >
                      {linkCopied ? <Check size={20} className="text-green-600" /> : <Link2 size={20} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-2xl font-bold mb-4">${currentPrice.toFixed(2)}</p>

          {/* Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-4 space-y-3">
              {product.variants.map((variant: any) => (
                <div key={variant.name}>
                  <label className="block text-sm font-medium mb-1">{variant.name}</label>
                  <div className="flex flex-wrap gap-2">
                    {variant.options?.map((option: any) => {
                      const isSelected = selectedVariants[variant.name] === option.value;
                      const isAvailable = option.stock > 0;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setSelectedVariants(prev => ({
                            ...prev,
                            [variant.name]: option.value
                          }))}
                          disabled={!isAvailable}
                          className={`px-4 py-2 border rounded-full text-sm transition ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isAvailable
                              ? 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                          }`}
                        >
                          {option.value}
                          {option.price_modifier > 0 && ` (+$${option.price_modifier})`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bullet-point Description */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">Product Details</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {formatDescription(product.description).map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>

          {/* Customer Review Photos Gallery */}
          {ratings.filter((r: any) => r.image).length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Customer Photos</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {ratings.filter((r: any) => r.image).map((r: any, i: number) => (
                  <img
                    key={i}
                    src={getImageUrl(r.image)}
                    alt={`Customer review ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                ))}
              </div>
            </div>
          )}

          {isCustomer ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <label className="font-medium">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={currentStock}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border rounded"
                />
                <span className="text-sm text-gray-500">
                  {currentStock} available
                </span>
              </div>

              {currentStock > 0 && currentStock <= LOW_STOCK_THRESHOLD && (
                <div className="mb-4 text-sm text-orange-600 font-medium flex items-center gap-1">
                  <span>⚠️</span> Only {currentStock} left in stock – order soon!
                </div>
              )}

              <div className="md:static fixed bottom-0 left-0 right-0 bg-white p-4 border-t md:border-t-0 md:p-0 z-40">
                <div className="container mx-auto max-w-2xl md:max-w-none">
                  <button
                    onClick={handleAddToCart}
                    disabled={currentStock < 1}
                    className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentStock < 1 ? 'Out of Stock' : 'Hadda Dalbo'}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <ShieldCheck size={16} /> Secure Checkout
                </div>
                <div className="flex items-center gap-1">
                  <Truck size={16} /> Fast Shipping
                </div>
                <div className="flex items-center gap-1">
                  <RefreshCw size={16} /> 24-hour delivery
                </div>
              </div>
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
        </div>
      </div>

      {/* Write a Review Link (Customers Only) */}
      {isCustomer && (
        <div className="mt-8 border-t pt-6">
          <button
            onClick={() => setShowRatingForm(!showRatingForm)}
            className="text-indigo-600 text-sm hover:underline"
          >
            Write a review
          </button>
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Add Photo (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setReviewImage(e.target.files?.[0] || null)}
                className="w-full"
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

      {/* Customer Reviews Section */}
      {ratings.length > 0 && (
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-6">
            {ratings.map((r: any) => (
              <div key={r.id} className="border-b pb-6 last:border-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= r.rating ? 'currentColor' : 'none'}
                        className={star <= r.rating ? 'text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{r.customer?.name || 'Anonymous'}</span>
                  {r.verified_purchase && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                      ✓ Verified Purchase
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.review && <p className="text-gray-700 mb-2">{r.review}</p>}
                {r.image && (
                  <img
                    src={getImageUrl(r.image)}
                    alt="Review"
                    className="w-24 h-24 object-cover rounded-lg border"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideo && (product as any).video_url && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X size={24} />
            </button>
            <iframe
              src={(product as any).video_url.replace('watch?v=', 'embed/')}
              className="w-full aspect-video rounded-lg"
              allowFullScreen
              title="Product video"
            />
          </div>
        </div>
      )}
    </div>
  );
}