'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, ShoppingCart } from 'lucide-react';
import { useT } from '@/components/providers/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n/translations';

type FooterLink = { labelKey: TranslationKey; href: string };
type FooterSection = { titleKey: TranslationKey; links: FooterLink[] };

const sections: FooterSection[] = [
  {
    titleKey: 'footer.section.shop',
    links: [
      { labelKey: 'footer.shop.all', href: '/products' },
      { labelKey: 'footer.shop.electronics', href: '/products?category=Electronics' },
      { labelKey: 'footer.shop.clothing', href: '/products?category=Clothing' },
      { labelKey: 'footer.shop.books', href: '/products?category=Books' },
      { labelKey: 'footer.shop.home', href: '/products?category=Home' },
    ],
  },
  {
    titleKey: 'footer.section.quickLinks',
    links: [
      { labelKey: 'footer.quick.home', href: '/' },
      { labelKey: 'footer.quick.cart', href: '/cart' },
      { labelKey: 'footer.quick.orders', href: '/orders' },
      { labelKey: 'footer.quick.signIn', href: '/login' },
      { labelKey: 'footer.quick.create', href: '/register' },
    ],
  },
  {
    titleKey: 'footer.section.support',
    links: [
      { labelKey: 'footer.support.help', href: '#' },
      { labelKey: 'footer.support.shipping', href: '#' },
      { labelKey: 'footer.support.returns', href: '#' },
      { labelKey: 'footer.support.tracking', href: '/orders' },
      { labelKey: 'footer.support.contact', href: '#' },
    ],
  },
];

const socials = [
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    path: 'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z',
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    path: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.42 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.42-.56-.22-.96-.48-1.38-.9a3.74 3.74 0 0 1-.9-1.38c-.16-.42-.36-1.06-.42-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.42C8.42 2.17 8.8 2.16 12 2.16Zm0 1.92c-3.15 0-3.5.01-4.74.07-1.07.05-1.66.23-2.05.38-.51.2-.88.44-1.27.83-.39.39-.63.76-.83 1.27-.15.39-.33.97-.38 2.05-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.07.23 1.66.38 2.05.2.51.44.88.83 1.27.39.39.76.63 1.27.83.39.15.97.33 2.05.38 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.07-.05 1.66-.23 2.05-.38.51-.2.88-.44 1.27-.83.39-.39.63-.76.83-1.27.15-.39.33-.97.38-2.05.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.07-.23-1.66-.38-2.05-.2-.51-.44-.88-.83-1.27a3.42 3.42 0 0 0-1.27-.83c-.39-.15-.97-.33-2.05-.38-1.24-.06-1.59-.07-4.74-.07Zm0 3.27a4.65 4.65 0 1 1 0 9.3 4.65 4.65 0 0 1 0-9.3Zm0 1.92a2.73 2.73 0 1 0 0 5.46 2.73 2.73 0 0 0 0-5.46Zm5.92-2.13a1.09 1.09 0 1 1-2.18 0 1.09 1.09 0 0 1 2.18 0Z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com',
    path: 'M23.5 6.51a3.02 3.02 0 0 0-2.13-2.14C19.49 3.86 12 3.86 12 3.86s-7.49 0-9.37.51A3.02 3.02 0 0 0 .5 6.51 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.49 3.02 3.02 0 0 0 2.13 2.14c1.88.51 9.37.51 9.37.51s7.49 0 9.37-.51a3.02 3.02 0 0 0 2.13-2.14A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.49ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z',
  },
];

export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-linear-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950">
      <div className="border-t border-gray-200 dark:border-gray-800" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Nex<span className="text-indigo-600 dark:text-indigo-400">Cart</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {t('footer.brand.tagline')}
            </p>

            <ul className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                  <Mail className="h-4 w-4" />
                </span>
                <a
                  href="mailto:support@nexcart.com"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  support@nexcart.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                  <Phone className="h-4 w-4" />
                </span>
                <a href="tel:+18001234567" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  +1 (800) 123-4567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <span>123 Commerce Ave, Suite 500</span>
              </li>
            </ul>
          </div>

          {/* Link columns */}
          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
            {sections.map((section) => (
              <div key={section.titleKey}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                  {t(section.titleKey)}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.labelKey}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 transition hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                      >
                        {t(link.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter / social bar */}
        <div className="mt-12 flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between dark:border-gray-800 dark:bg-gray-900/70">
          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
              {t('footer.newsletter.title')}
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {t('footer.newsletter.desc')}
            </p>
          </div>
          <form
            className="flex w-full max-w-md gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder={t('footer.newsletter.placeholder')}
              className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
            />
            <button
              type="submit"
              className="rounded-full bg-linear-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/30 transition hover:shadow-lg hover:shadow-indigo-500/40"
            >
              {t('footer.newsletter.subscribe')}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col-reverse items-center justify-between gap-4 px-4 py-6 sm:px-6 md:flex-row lg:px-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('footer.copyright', { year })}
          </p>

          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 transition hover:bg-indigo-600 hover:text-white hover:ring-indigo-600 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-800 dark:hover:bg-indigo-500 dark:hover:text-white dark:hover:ring-indigo-500"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
            <Link href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              {t('footer.legal.privacy')}
            </Link>
            <Link href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              {t('footer.legal.terms')}
            </Link>
            <Link href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              {t('footer.legal.cookies')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
