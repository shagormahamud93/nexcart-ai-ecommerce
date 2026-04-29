'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  BarChart3,
  Star,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Reviews', href: '/admin/reviews', icon: Star },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const currentNav = navigation.find((item) => isActive(item.href));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm transition-opacity lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-gray-200 bg-white shadow-xl transition-transform duration-200 dark:border-gray-800 dark:bg-gray-900 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          isActive={isActive}
          onNavigate={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          userName={user?.name}
          userEmail={user?.email}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:block">
        <SidebarContent
          isActive={isActive}
          onLogout={handleLogout}
          userName={user?.name}
          userEmail={user?.email}
        />
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-xl text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Admin
                </p>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {currentNav?.name ?? 'Dashboard'}
                </h2>
              </div>
            </div>

            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-800/60 dark:hover:text-white sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to store
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  isActive,
  onNavigate,
  onLogout,
  onClose,
  userName,
  userEmail,
}: {
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  onLogout: () => void;
  onClose?: () => void;
  userName?: string;
  userEmail?: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
        <Link href="/admin" className="flex items-center gap-2" onClick={onNavigate}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30">
            <ShoppingCart className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
            Nex<span className="text-indigo-600 dark:text-indigo-400">Cart</span>
            <span className="ml-1 text-xs font-medium text-gray-400 dark:text-gray-500">
              Admin
            </span>
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-linear-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:from-indigo-500/15 dark:to-purple-500/15 dark:text-indigo-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-white'
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/40'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-gray-700 dark:group-hover:text-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {item.name}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        {userName && (
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white">
              {userName?.charAt(0).toUpperCase() || 'A'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {userName}
              </p>
              {userEmail && (
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {userEmail}
                </p>
              )}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-700 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
