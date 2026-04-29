'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { ProductCard } from '@/components/product/ProductCard';
import { CategorySidebar } from '@/components/category/CategorySidebar';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categorySlug = searchParams.get('category') ?? '';
  const searchTerm = searchParams.get('search') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  const [searchInput, setSearchInput] = useState(searchTerm);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  const { categories } = useCategoryStore();
  const { products, pagination, isLoading, error, fetchProducts } =
    useProductStore();

  useEffect(() => {
    fetchProducts({
      category: categorySlug || undefined,
      search: searchTerm || undefined,
      page,
    });
  }, [categorySlug, searchTerm, page, fetchProducts]);

  const updateQuery = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `/products?${qs}` : '/products', { scroll: false });
    },
    [router, searchParams]
  );

  const handleSelectCategory = useCallback(
    (slug: string) => {
      updateQuery({ category: slug || undefined, page: undefined });
      setDrawerOpen(false);
    },
    [updateQuery]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: searchInput.trim() || undefined, page: undefined });
  };

  const setPage = (next: number) => {
    updateQuery({ page: next > 1 ? String(next) : undefined });
  };

  const activeCategoryName = useMemo(() => {
    if (!categorySlug) return null;
    return (
      categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug
    );
  }, [categories, categorySlug]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {activeCategoryName ?? 'All Products'}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {pagination
                ? `${pagination.total} ${pagination.total === 1 ? 'product' : 'products'}`
                : 'Browse our catalog'}
              {searchTerm && ` • matching “${searchTerm}”`}
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="relative w-full sm:w-80"
            role="search"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
            />
          </form>
        </div>

        {/* Mobile filter trigger */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Categories
          {activeCategoryName && (
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
              {activeCategoryName}
            </span>
          )}
        </button>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <CategorySidebar
                activeSlug={categorySlug}
                onSelect={handleSelectCategory}
                className="max-h-[calc(100vh-7rem)]"
              />
            </div>
          </div>

          {/* Main */}
          <div>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-lg bg-white shadow dark:bg-gray-900"
                  >
                    <div className="h-48 rounded-t-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                      <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {pagination && pagination.pages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                      >
                        Previous
                      </button>
                      {Array.from({ length: pagination.pages }).map((_, i) => {
                        const p = i + 1;
                        if (
                          p === 1 ||
                          p === pagination.pages ||
                          (p >= page - 1 && p <= page + 1)
                        ) {
                          return (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={`rounded-md px-3 py-2 text-sm font-medium ${
                                p === page
                                  ? 'border border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
                                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        }
                        if (p === page - 2 || p === page + 2) {
                          return (
                            <span key={p} className="px-1 text-gray-400">
                              …
                            </span>
                          );
                        }
                        return null;
                      })}
                      <button
                        onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                        disabled={page === pagination.pages}
                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
                <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                  No products found
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try a different category or search term.
                </p>
                {(categorySlug || searchTerm) && (
                  <button
                    onClick={() =>
                      updateQuery({
                        category: undefined,
                        search: undefined,
                        page: undefined,
                      })
                    }
                    className="mt-4 rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          drawerOpen ? '' : 'pointer-events-none'
        }`}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 dark:bg-gray-900 ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Categories
            </h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Close categories"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <CategorySidebar
              activeSlug={categorySlug}
              onSelect={handleSelectCategory}
              className="border-0 p-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
