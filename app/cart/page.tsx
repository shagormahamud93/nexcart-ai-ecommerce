'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { CartItemComponent } from '@/components/cart/CartItem';
import { useT } from '@/components/providers/LanguageProvider';

export default function CartPage() {
  const { user } = useAuthStore();
  const { items, total, isLoading, error, fetchCart } = useCartStore();
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-950">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {t('cart.signInPrompt')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('cart.signInDesc')}
          </p>
          <div className="mt-6">
            <Link
              href="/login?next=%2Fcart"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/30"
            >
              {t('cart.signIn')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('cart.continueShopping')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('cart.title')}</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              {t('cart.empty.title')}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('cart.empty.desc')}
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/30"
              >
                {t('cart.empty.cta')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:shadow-black/30">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('cart.itemsCount', { count: items.length })}
              </h2>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {items.map((item) => (
                <CartItemComponent key={item.id} item={item} />
              ))}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg dark:bg-gray-800/40 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('cart.total')}: ${total.toFixed(2)}
                </span>
                <Link
                  href="/checkout"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/30 transition"
                >
                  {t('cart.checkout')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}