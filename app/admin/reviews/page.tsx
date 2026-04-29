'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuthStore } from '@/stores/authStore';

interface AdminReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  product: { id: string; name: string };
}

interface ProductOption {
  id: string;
  name: string;
}

interface AdminReviewsResponse {
  reviews: AdminReview[];
  products: ProductOption[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

type RatingFilter = 'ALL' | '1' | '2' | '3' | '4' | '5';

export default function AdminReviewsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [productId, setProductId] = useState('');
  const [rating, setRating] = useState<RatingFilter>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (productId) query.set('productId', productId);
      if (rating !== 'ALL') query.set('rating', rating);
      if (debouncedSearch) query.set('search', debouncedSearch);
      query.set('page', page.toString());
      query.set('limit', '20');

      const res = await fetch(`/api/admin/reviews?${query}`);
      if (res.status === 401 || res.status === 403) {
        router.push('/');
        return;
      }
      if (!res.ok) {
        toast.error('Failed to load reviews');
        return;
      }
      const data: AdminReviewsResponse = await res.json();
      setReviews(data.reviews);
      setProducts(data.products);
      setPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [productId, rating, debouncedSearch, page, router]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchReviews();
  }, [user, router, fetchReviews]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this review? This cannot be undone.')) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to delete review');
      }
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success('Review deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  const productLookup = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.name])),
    [products]
  );

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-gray-800 dark:border-t-indigo-400" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Review Management
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Moderate product reviews. {total} review{total === 1 ? '' : 's'} total.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search comments, users, products…"
              className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
            />
          </div>

          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setPage(1);
            }}
            className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={rating}
            onChange={(e) => {
              setRating(e.target.value as RatingFilter);
              setPage(1);
            }}
            className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
          >
            <option value="ALL">All ratings</option>
            {(['5', '4', '3', '2', '1'] as const).map((r) => (
              <option key={r} value={r}>
                {r} star{r === '1' ? '' : 's'}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Comment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-gray-800 dark:border-t-indigo-400" />
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      No reviews match these filters.
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr
                      key={review.id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-6 py-3 align-top">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {review.user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {review.user.email}
                        </p>
                      </td>
                      <td className="px-6 py-3 align-top text-sm text-gray-700 dark:text-gray-300">
                        {review.product.name ?? productLookup[review.product.id] ?? '—'}
                      </td>
                      <td className="px-6 py-3 align-top">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-700'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                            {review.rating}/5
                          </span>
                        </div>
                      </td>
                      <td className="max-w-md px-6 py-3 align-top">
                        <p className="text-sm text-gray-700 line-clamp-3 dark:text-gray-300">
                          {review.comment}
                        </p>
                      </td>
                      <td className="px-6 py-3 align-top text-xs text-gray-500 dark:text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 align-top text-right">
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={deletingId === review.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingId === review.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page <span className="font-medium text-gray-900 dark:text-white">{page}</span> of{' '}
                <span className="font-medium text-gray-900 dark:text-white">{pages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
