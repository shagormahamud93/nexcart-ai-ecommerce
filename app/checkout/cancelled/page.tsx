'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function CheckoutCancelledPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Payment Cancelled</h1>
          <p className="mt-2 text-lg text-gray-600">
            Your payment was cancelled. No charges were made to your account.
          </p>
        </div>

        <div className="mt-12 bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Don't worry! Your cart items are still saved. You can try again or continue shopping.
            </p>
            <div className="space-y-4">
              <Link
                href="/cart"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Return to Cart
              </Link>
              <div>
                <Link
                  href="/products"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}