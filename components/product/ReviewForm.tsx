'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { useReviewStore } from '@/stores/reviewStore';
import { StarRating } from './StarRating';

interface ReviewFormProps {
  productId: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ productId, onSubmitted }: ReviewFormProps) {
  const { user } = useAuthStore();
  const { submitReview, isSubmitting } = useReviewStore();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Please{' '}
          <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            log in
          </a>{' '}
          to leave a review.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5');
      return;
    }
    if (comment.trim().length < 3) {
      toast.error('Comment must be at least 3 characters');
      return;
    }

    try {
      await submitReview({ productId, rating, comment: comment.trim() });
      toast.success('Thanks for your review!');
      setComment('');
      setRating(5);
      onSubmitted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit review');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Write a review
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Share your experience with this product.
      </p>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Your rating
        </label>
        <div className="mt-2">
          <StarRating value={rating} onChange={setRating} size={28} />
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="review-comment"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Your review
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={2000}
          required
          minLength={3}
          placeholder="What did you like or dislike?"
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
        />
        <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/2000</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
      >
        {isSubmitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
