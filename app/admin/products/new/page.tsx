'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ProductForm } from '@/components/product/ProductForm';

export default function NewProductPage() {
  const router = useRouter();

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/admin/products"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Product</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <ProductForm onSuccess={() => router.push('/admin/products')} />
        </div>
      </div>
    </AdminLayout>
  );
}
