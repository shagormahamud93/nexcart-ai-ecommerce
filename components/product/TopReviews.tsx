'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Quote } from 'lucide-react';
import { StarRating } from './StarRating';

interface TopReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string; avatar?: string | null };
  product: { id: string; name: string; images: string[] };
}

function anonymize(name: string): string {
  if (!name) return 'Anonymous';
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (parts.length === 1) {
    return first.length <= 1 ? first : `${first.charAt(0)}${'•'.repeat(first.length - 1)}`;
  }
  return `${first} ${last.charAt(0)}.`;
}

export function TopReviews() {
  const [reviews, setReviews] = useState<TopReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/reviews/top?limit=8');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setReviews(data.reviews ?? []);
      } catch {
        // silent fail – section just won't render
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Top Customer Reviews
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600 dark:text-gray-400">
          Real feedback from shoppers who love what they bought.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-gray-200 bg-white/80 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="group flex w-80 shrink-0 snap-start flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-auto dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30 dark:hover:shadow-black/50"
            >
              <Quote className="h-6 w-6 text-indigo-200 dark:text-indigo-500/40" aria-hidden="true" />

              <div className="mt-2">
                <StarRating value={review.rating} readOnly size={16} />
              </div>

              <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {review.comment}
              </p>

              <div className="mt-auto pt-5">
                <Link
                  href={`/product/${review.product.id}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition group-hover:border-indigo-100 group-hover:bg-indigo-50/40 dark:border-gray-800 dark:bg-gray-800/60 dark:group-hover:border-indigo-500/30 dark:group-hover:bg-indigo-500/10"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                    {review.product.images?.[0] ? (
                      <Image
                        src={review.product.images[0]}
                        alt={review.product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {review.product.name}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      by {anonymize(review.user.name)}
                    </p>
                  </div>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
