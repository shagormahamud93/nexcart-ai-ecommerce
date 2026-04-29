'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ProductForm } from '@/components/product/ProductForm';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
}

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          setProduct(await res.json());
        } else {
          toast.error('Product not found');
          router.push('/admin/products');
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    })();
  }, [productId, router]);

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>
        <div className="bg-white shadow rounded-lg p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : product ? (
            <ProductForm
              product={product}
              onSuccess={() => router.push('/admin/products')}
            />
          ) : (
            <p>Product not found.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
