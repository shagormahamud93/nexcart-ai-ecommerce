'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  ShoppingCart,
  ChevronDown,
  Package,
  LogOut,
  LayoutDashboard,
  Home as HomeIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useT } from '@/components/providers/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n/translations';

const navLinks: { key: TranslationKey; href: string; icon: typeof HomeIcon }[] = [
  { key: 'nav.home', href: '/', icon: HomeIcon },
  { key: 'nav.products', href: '/products', icon: Package },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const cartItems = useCartStore((s) => s.items);
  const t = useT();

  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const cartCount = mounted
    ? cartItems.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setProfileOpen(false);
      setMobileOpen(false);
      router.push('/');
      toast.success(t('auth.loggedOut'));
    } catch {
      toast.error(t('auth.logoutFailed'));
    }
  };

  const isActive = (href: string) => {
    const path = href.split('?')[0];
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-md border-b border-gray-200/60 dark:bg-gray-950/80 dark:border-gray-800/60 dark:shadow-black/40'
          : 'bg-white/60 backdrop-blur-md border-b border-gray-200/40 dark:bg-gray-950/60 dark:border-gray-800/40'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4 lg:h-20 lg:gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label={t('nav.logoAria')}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <span className="hidden text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:inline">
              Nex<span className="text-indigo-600 dark:text-indigo-400">Cart</span>
            </span>
          </Link>

          {/* Desktop search */}
          <form
            onSubmit={handleSearch}
            className="relative hidden flex-1 max-w-xl md:block"
            role="search"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('nav.search.placeholder')}
              className="w-full rounded-full border border-gray-200 bg-white/80 py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:bg-gray-900 dark:focus:ring-indigo-400/20"
            />
          </form>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive(link.href)
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <LanguageToggle />
            <ThemeToggle />

            <Link
              href="/cart"
              aria-label={t('nav.cart')}
              className="relative grid h-10 w-10 place-items-center rounded-full text-gray-700 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
            >
              <ShoppingCart className="h-5 w-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-950">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Auth area (desktop) */}
            <div className="hidden md:block" ref={profileRef}>
              {mounted && user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 py-1.5 pl-1.5 pr-3 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-white dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-100 dark:hover:bg-gray-900"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                    <span className="max-w-32 truncate">{user.name}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-500 transition dark:text-gray-400 ${
                        profileOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {profileOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-black/50"
                    >
                      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <ProfileItem
                          href="/orders"
                          icon={<Package className="h-4 w-4" />}
                          label={t('profile.myOrders')}
                        />
                        <ProfileItem
                          href="/cart"
                          icon={<ShoppingCart className="h-4 w-4" />}
                          label={t('profile.myCart')}
                        />
                        {user.role === 'ADMIN' && (
                          <ProfileItem
                            href="/admin"
                            icon={<LayoutDashboard className="h-4 w-4" />}
                            label={t('profile.adminDashboard')}
                          />
                        )}
                      </div>
                      <div className="border-t border-gray-100 py-1 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <LogOut className="h-4 w-4" />
                          {t('auth.signOut')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                  >
                    {t('auth.login')}
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/30 transition hover:shadow-lg hover:shadow-indigo-500/40"
                  >
                    {t('auth.signup')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label={t('nav.menu.toggle')}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
              className="grid h-10 w-10 place-items-center rounded-full text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 lg:hidden"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          className={`grid overflow-hidden transition-all duration-300 lg:hidden ${
            mobileOpen
              ? 'grid-rows-[1fr] opacity-100 pb-4'
              : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="min-h-0">
            <form onSubmit={handleSearch} className="relative mt-2 md:hidden">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('nav.search.placeholder.short')}
                className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
              />
            </form>

            <nav className="mt-3 flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.key}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive(link.href)
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {t(link.key)}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-800">
              {mounted && user ? (
                <div className="flex flex-col gap-1">
                  <div className="mb-1 flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-900">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/orders"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Package className="h-5 w-5" /> {t('profile.myOrders')}
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <LayoutDashboard className="h-5 w-5" /> {t('profile.adminDashboard')}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <LogOut className="h-5 w-5" /> {t('auth.signOut')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
                  >
                    {t('auth.login')}
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-md shadow-indigo-500/30"
                  >
                    {t('auth.signup')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ProfileItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
    >
      {icon}
      {label}
    </Link>
  );
}
