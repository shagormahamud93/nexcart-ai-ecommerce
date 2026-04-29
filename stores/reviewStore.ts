import { create } from 'zustand';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string; avatar?: string | null };
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

interface ReviewState {
  reviews: Review[];
  summary: ReviewSummary | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  fetchProductReviews: (productId: string) => Promise<void>;
  submitReview: (input: {
    productId: string;
    rating: number;
    comment: string;
  }) => Promise<Review>;
  clearError: () => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  reviews: [],
  summary: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchProductReviews: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/reviews/product/${productId}`);
      if (!res.ok) throw new Error('Failed to load reviews');
      const data = await res.json();
      set({ reviews: data.reviews, summary: data.summary, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  submitReview: async ({ productId, rating, comment }) => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit review');
      }
      set((state) => ({
        reviews: [data, ...state.reviews],
        isSubmitting: false,
      }));
      return data as Review;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isSubmitting: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
