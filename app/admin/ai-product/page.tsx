'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2, RefreshCw, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';

type GeneratedProduct = {
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  meta?: {
    adminCategory?: string | null;
    suggestedCategory?: string;
    textModel?: string;
    imageModel?: string;
    imagePrompt?: string;
    generatedAt?: string;
  };
};

export default function AdminAiProductPage() {
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState<GeneratedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const trimmedIdea = idea.trim();
    if (trimmedIdea.length < 3) {
      toast.error('Describe the product idea (at least 3 characters).');
      return;
    }

    const minNum = minPrice ? Number(minPrice) : undefined;
    const maxNum = maxPrice ? Number(maxPrice) : undefined;
    if (minNum != null && Number.isNaN(minNum)) {
      toast.error('Min price must be a number.');
      return;
    }
    if (maxNum != null && Number.isNaN(maxNum)) {
      toast.error('Max price must be a number.');
      return;
    }
    if (minNum != null && maxNum != null && minNum > maxNum) {
      toast.error('Min price cannot be greater than max price.');
      return;
    }

    const priceRange =
      minNum != null || maxNum != null
        ? {
            ...(minNum != null ? { min: minNum } : {}),
            ...(maxNum != null ? { max: maxNum } : {}),
          }
        : undefined;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: trimmedIdea,
          ...(category.trim() ? { category: category.trim() } : {}),
          ...(priceRange ? { priceRange } : {}),
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | (GeneratedProduct & { error?: string })
        | { error?: string }
        | null;

      if (!res.ok) {
        const msg =
          (data && 'error' in data && data.error) ||
          `Generation failed (HTTP ${res.status}).`;
        setError(msg);
        toast.error(msg);
        return;
      }

      if (!data || !('title' in data)) {
        const msg = 'Unexpected response from server.';
        setError(msg);
        toast.error(msg);
        return;
      }

      setPreview(data as GeneratedProduct);
      toast.success('Preview generated.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!preview) return;
    if (!preview.category?.trim()) {
      toast.error('Category is required to publish.');
      return;
    }
    const stockNum = stock === '' ? 0 : Number(stock);
    if (Number.isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      toast.error('Stock must be a non-negative whole number.');
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/admin/ai/publish-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: preview.title,
          description: preview.description,
          price: preview.price,
          category: preview.category,
          stock: stockNum,
          imageUrl: preview.imageUrl ?? undefined,
          meta: preview.meta,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | {
            id: string;
            url: string;
            warning?: string | null;
            facebook?: {
              posted: boolean;
              postId?: string;
              error?: string;
              skipped?: boolean;
            };
          }
        | { error?: string }
        | null;

      if (!res.ok) {
        const msg =
          (data && 'error' in data && data.error) ||
          `Publish failed (HTTP ${res.status}).`;
        toast.error(msg);
        return;
      }
      if (!data || !('id' in data)) {
        toast.error('Unexpected response from server.');
        return;
      }
      if (data.warning) {
        toast(data.warning, { icon: '⚠️', duration: 6000 });
      }
      if (data.facebook?.posted) {
        toast.success('Shared on Facebook.', { icon: '📘' });
      } else if (data.facebook?.error && !data.facebook.skipped) {
        toast(`Facebook share failed: ${data.facebook.error}`, {
          icon: '⚠️',
          duration: 6000,
        });
      }
      toast.success('Product published.');
      router.push(data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
        <Link
          href="/admin/products"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            AI Product Generator
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Generate a product preview with AI. Nothing is saved until you publish it manually.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <form
            onSubmit={handleGenerate}
            className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 space-y-4 border border-gray-200 dark:border-gray-800"
          >
            <div>
              <label
                htmlFor="idea"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Product idea <span className="text-red-500">*</span>
              </label>
              <textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="e.g. minimalist walnut desk organizer with three compartments"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={loading}
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                {idea.length}/500
              </p>
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Category <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                maxLength={80}
                placeholder="Home Office"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price range USD <span className="text-gray-400 font-normal">(optional)</span>
              </span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  disabled={loading}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || idea.trim().length < 3}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : preview ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </button>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </form>

          {/* Preview card + publish */}
          <div className="flex flex-col gap-3">
            <div className="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
              {loading && !preview ? (
                <PreviewSkeleton />
              ) : preview ? (
                <PreviewCard data={preview} />
              ) : (
                <PreviewEmpty />
              )}
            </div>

            {preview && (
              <div className="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Initial stock
                  </label>
                  <input
                    id="stock"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-32 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    disabled={publishing}
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing || loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Publish Product
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Publishing creates the product in the database. You'll be redirected to its
                  page.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
          Note: Preview only — no product is created in the database. The image URL from the
          AI provider is temporary (about one hour) and must be re-uploaded to permanent
          storage when you publish.
        </p>
      </div>
    </AdminLayout>
  );
}

function PreviewCard({ data }: { data: GeneratedProduct }) {
  return (
    <>
      <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-800">
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt={data.title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No image returned
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
            {data.title}
          </h2>
          <span className="shrink-0 rounded-md bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            ${data.price.toFixed(2)}
          </span>
        </div>
        {data.category && (
          <span className="self-start rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            {data.category}
          </span>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
          {data.description}
        </p>
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
          {data.meta?.textModel && <span>Text: {data.meta.textModel}</span>}
          {data.meta?.imageModel && <span>Image: {data.meta.imageModel}</span>}
        </div>
      </div>
    </>
  );
}

function PreviewSkeleton() {
  return (
    <>
      <div className="aspect-square w-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    </>
  );
}

function PreviewEmpty() {
  return (
    <div className="flex h-full min-h-80 flex-col items-center justify-center p-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 mb-3">
        <Sparkles className="h-6 w-6 text-indigo-600" />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
        No preview yet
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-xs">
        Describe a product idea on the left and click Generate. Nothing is published until you
        say so.
      </p>
    </div>
  );
}
