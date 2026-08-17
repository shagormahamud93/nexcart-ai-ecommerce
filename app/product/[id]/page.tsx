'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useProductStore } from '@/stores/productStore';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useReviewStore } from '@/stores/reviewStore';
import { ReviewForm } from '@/components/product/ReviewForm';
import { StarRating } from '@/components/product/StarRating';
import { FacebookShareButton } from '@/components/product/FacebookShareButton';
import { loginUrlFor } from '@/lib/auth/redirect';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [selectedImage, setSelectedImage] = useState(0);

  const { currentProduct, isLoading, error, fetchProduct } = useProductStore();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const {
    reviews,
    summary,
    fetchProductReviews,
  } = useReviewStore();

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
      fetchProductReviews(productId);
    }
  }, [productId, fetchProduct, fetchProductReviews]);

  const hasReviewed = Boolean(
    user && reviews.some((r) => r.userId === user.id)
  );

  const handleAddToCart = async () => {
    if (!user) {
      router.push(loginUrlFor(`/product/${productId}`));
      return;
    }
    if (!currentProduct) return;
    try {
      await addToCart(currentProduct.id);
      toast.success('Added to cart!');
    } catch {
      // Error handled in store
    }
  };

  const handleAddToWishlist = () => {
    if (!user) {
      router.push(loginUrlFor(`/product/${productId}`));
      return;
    }
    // TODO: Implement wishlist functionality
    toast.success('Added to wishlist!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600">{error || 'The product you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
              {currentProduct.images[selectedImage] ? (
                <Image
                  src={currentProduct.images[selectedImage]}
                  alt={currentProduct.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Image
                </div>
              )}
            </div>
            {currentProduct.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {currentProduct.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md overflow-hidden border-2 ${
                      selectedImage === index ? 'border-indigo-500' : 'border-transparent'
                    }`}
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt={`${currentProduct.name} ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-100">
                {currentProduct.name}
              </h1>
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(currentProduct.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-2 dark:text-gray-400">
                  {currentProduct.rating.toFixed(1)} ({currentProduct.reviewCount} reviews)
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-4 dark:text-gray-100">
                ${currentProduct.price.toFixed(2)}
              </p>
              <p className="text-gray-700 mb-4 dark:text-gray-400">{currentProduct.description}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Category: <span className="font-medium">{currentProduct.category}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stock: <span className="font-medium">{currentProduct.stock}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={currentProduct.stock === 0}
                className="flex-1 flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {currentProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleAddToWishlist}
                className="p-3 border border-gray-300 dark:border-gray-800 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Heart className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <FacebookShareButton url={`/product/${currentProduct.id}`} />
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 border-t border-gray-200 pt-10 dark:border-gray-800">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customer Reviews</h2>
                {summary && summary.totalReviews > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:bg-gray-950">
                    <StarRating value={Math.round(summary.averageRating)} readOnly size={18} />
                    <span className="font-semibold text-gray-900 dark:text-gray-400">
                      {summary.averageRating.toFixed(1)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      ({summary.totalReviews})
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-6">
                {reviews.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-400">
                    No reviews yet. Be the first to share your experience!
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-gray-950 dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                            {review.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-400">
                              {review.user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <StarRating value={review.rating} readOnly size={16} />
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-400">
                        {review.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              {hasReviewed ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thanks for reviewing!
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You&apos;ve already shared your feedback for this product.
                  </p>
                </div>
              ) : (
                <ReviewForm productId={currentProduct.id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}