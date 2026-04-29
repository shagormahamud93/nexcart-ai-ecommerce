'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  rating: number;
  reviewCount: number;
  images: string[];
  createdAt: string;
}

export default function AdminProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
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
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">Product not found.</div>
      </AdminLayout>
    );
  }

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

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Product
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Price</dt>
                <dd>${product.price.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Category</dt>
                <dd>{product.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Stock</dt>
                <dd>{product.stock}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Rating</dt>
                <dd>{product.rating.toFixed(1)} ({product.reviewCount})</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd>{new Date(product.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-sm">{product.description}</p>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Images</h2>
            {product.images.length === 0 ? (
              <p className="text-sm text-gray-500">No images.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {product.images.map((src, i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
