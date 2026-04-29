'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import AdminLayout from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  orderStatusDistribution: Array<{ status: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function AdminAnalyticsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
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

    fetchAnalytics();
  }, [user, router]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      toast.error('An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN' || loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-gray-800 dark:border-t-indigo-400" />
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          No analytics data available
        </div>
      </AdminLayout>
    );
  }

  const metricCards = [
    {
      label: 'Total Revenue',
      value: `$${analytics.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      accent: 'from-amber-500/5 to-transparent',
    },
    {
      label: 'Total Orders',
      value: analytics.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      accent: 'from-emerald-500/5 to-transparent',
    },
    {
      label: 'Total Users',
      value: analytics.totalUsers.toLocaleString(),
      icon: Users,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      accent: 'from-blue-500/5 to-transparent',
    },
    {
      label: 'Total Products',
      value: analytics.totalProducts.toLocaleString(),
      icon: Package,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      accent: 'from-purple-500/5 to-transparent',
    },
  ];

  const maxRevenue = Math.max(...analytics.monthlyRevenue.map((m) => m.revenue), 1);
  const maxStatusCount = Math.max(
    ...analytics.orderStatusDistribution.map((s) => s.count),
    1
  );

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Overview of your store&apos;s performance and insights
          </p>
        </div>

        {/* Key Metrics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => {
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Monthly Revenue */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Monthly Revenue
              </h3>
            </div>
            <div className="space-y-4 p-6">
              {analytics.monthlyRevenue.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No data yet</p>
              ) : (
                analytics.monthlyRevenue.map((month) => (
                  <div key={month.month} className="flex items-center gap-4">
                    <span className="w-20 shrink-0 text-sm text-gray-600 dark:text-gray-400">
                      {month.month}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all"
                        style={{
                          width: `${Math.min((month.revenue / maxRevenue) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      ${month.revenue.toFixed(0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Order Status Distribution
              </h3>
            </div>
            <div className="space-y-4 p-6">
              {analytics.orderStatusDistribution.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No data yet</p>
              ) : (
                analytics.orderStatusDistribution.map((status) => (
                  <div key={status.status} className="flex items-center gap-4">
                    <span className="w-24 shrink-0 text-sm capitalize text-gray-600 dark:text-gray-400">
                      {status.status.toLowerCase()}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-500 transition-all"
                        style={{
                          width: `${Math.min((status.count / maxStatusCount) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {status.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Top Products
              </h3>
            </div>
            <div className="p-3">
              {analytics.topProducts.length === 0 ? (
                <p className="px-3 py-6 text-sm text-gray-500 dark:text-gray-400">
                  No top products yet
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {analytics.topProducts.slice(0, 5).map((product, index) => (
                    <li
                      key={product.name}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        #{index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-white">
                        {product.name}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${product.revenue.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {product.sales} sold
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h3>
            </div>
            <div className="space-y-3 p-6">
              {analytics.recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
              ) : (
                analytics.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                      <Activity className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {activity.description}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
