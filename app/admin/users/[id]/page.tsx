'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, Shield } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  orders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  _count: { orders: number };
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          toast.error('User not found');
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load user');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">User not found.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/admin/users"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white shadow rounded-lg p-6">
            <h1 className="text-xl font-bold mb-2 flex items-center">
              {user.name}
              {user.role === 'ADMIN' && <Shield className="ml-2 h-4 w-4 text-purple-500" />}
            </h1>
            <p className="text-sm text-gray-500 flex items-center mb-1">
              <Mail className="w-4 h-4 mr-1" />
              {user.email}
            </p>
            <p className="text-sm text-gray-500 flex items-center mb-4">
              <Calendar className="w-4 h-4 mr-1" />
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
            <div className="space-y-1 text-sm">
              <p>Role: <span className="font-medium">{user.role}</span></p>
              <p>Status: <span className="font-medium">{user.isActive ? 'Active' : 'Inactive'}</span></p>
              <p>Total orders: <span className="font-medium">{user._count.orders}</span></p>
            </div>
          </div>

          <div className="md:col-span-2 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Recent Orders</h2>
            {user.orders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {user.orders.map((o) => (
                  <li key={o.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        #{o.id.slice(-8)}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {new Date(o.createdAt).toLocaleDateString()} · {o.status}
                      </p>
                    </div>
                    <span className="text-sm font-medium">${o.total.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
