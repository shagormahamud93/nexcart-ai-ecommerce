'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      description: string;
      images: string[];
    };
  }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { user } = useAuthStore();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!orderId) {
      router.push('/orders');
      return;
    }

    fetchOrder();
  }, [user, orderId, router]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else if (response.status === 404) {
        toast.error('Order not found');
        router.push('/orders');
      } else {
        toast.error('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Fetch order error:', error);
      toast.error('An error occurred while fetching order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'SHIPPED':
        return <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'DELIVERED':
        return <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Package className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-500/15';
      case 'SHIPPED':
        return 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/15';
      case 'DELIVERED':
        return 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-500/15';
      case 'CANCELLED':
        return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-500/15';
      default:
        return 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-500/15';
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Details</h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="ml-2">{order.status}</span>
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:shadow-black/30">
            <h2 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Order ID</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Order Date</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(order.updatedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="font-medium text-lg text-gray-900 dark:text-white">${order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:shadow-black/30">
            <h2 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0 dark:border-gray-800">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden dark:bg-gray-800">
                    {item.product.images[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-xs dark:text-gray-500">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 dark:text-gray-400">
                      {item.product.description}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      ${item.price.toFixed(2)} each
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900 dark:text-white">Order Total</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}