'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import AdminLayout from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: Array<{
    id: string;
    user: { name: string; email: string };
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchDashboardStats();
  }, [user, router]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('An error occurred while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30';
      case 'SHIPPED':
        return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/30';
      case 'DELIVERED':
        return 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-400/30';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/30';
      default:
        return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30';
    }
  };

  if (!user || user.role !== 'ADMIN' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-gray-800 dark:border-t-indigo-400"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      accent: 'from-blue-500/5 to-transparent',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      accent: 'from-emerald-500/5 to-transparent',
    },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      accent: 'from-amber-500/5 to-transparent',
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders.toLocaleString(),
      icon: Clock,
      iconBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      accent: 'from-orange-500/5 to-transparent',
    },
  ];

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Welcome back, {user.name}
          </h1>
          <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
            Here&apos;s a snapshot of what&apos;s happening with your store today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-linear-to-br ${card.accent}`}
                />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {card.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                      {card.value}
                    </p>
                  </div>
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${card.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Recent Orders
                </h2>
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="p-3">
                {stats.recentOrders.length === 0 ? (
                  <div className="px-3 py-12 text-center">
                    <ShoppingCart className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-700" />
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                      No recent orders yet
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {stats.recentOrders.map((order) => (
                      <li
                        key={order.id}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white">
                            {order.user.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {order.user.name}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                              #{order.id.slice(-8)} · {order.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            ${order.total.toFixed(2)}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h2>
            </div>
            <div className="space-y-2 p-3">
              <QuickAction
                href="/admin/orders"
                icon={Package}
                title="Manage Orders"
                description="View and update order status"
                accent="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
              />
              <QuickAction
                href="/admin/products"
                icon={TrendingUp}
                title="Manage Products"
                description="Add, edit, and remove products"
                accent="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              />
              <QuickAction
                href="/admin/users"
                icon={Users}
                title="Manage Users"
                description="View and manage user accounts"
                accent="text-blue-600 dark:text-blue-400 bg-blue-500/10"
              />
              {stats.lowStockProducts > 0 && (
                <Link
                  href="/admin/products?filter=low-stock"
                  className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:hover:bg-red-500/15"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
                    <AlertCircle className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                      Low Stock Alert
                    </p>
                    <p className="truncate text-xs text-red-700 dark:text-red-300/80">
                      {stats.lowStockProducts} product{stats.lowStockProducts === 1 ? '' : 's'} need attention
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800/50"
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-gray-300 transition group-hover:text-indigo-500 dark:text-gray-600 dark:group-hover:text-indigo-400" />
    </Link>
  );
}
