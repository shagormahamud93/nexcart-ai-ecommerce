'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { useT } from '@/components/providers/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n/translations';
import { TopReviews } from '@/components/product/TopReviews';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';

const features: {
  icon: typeof Truck;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}[] = [
  {
    icon: Truck,
    titleKey: 'home.feature.shipping.title',
    descKey: 'home.feature.shipping.desc',
  },
  {
    icon: ShieldCheck,
    titleKey: 'home.feature.secure.title',
    descKey: 'home.feature.secure.desc',
  },
  {
    icon: Sparkles,
    titleKey: 'home.feature.curated.title',
    descKey: 'home.feature.curated.desc',
  },
];

export default function Home() {
  const t = useT();

  return (
    <div className="bg-linear-to-b from-indigo-50/50 via-white to-white text-gray-900 dark:bg-gray-950 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 dark:text-gray-100">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/15" />
          <div className="absolute top-32 right-10 h-72 w-72 rounded-full bg-purple-300/40 blur-3xl dark:bg-purple-500/15" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-indigo-700 shadow-sm backdrop-blur dark:border-indigo-500/30 dark:bg-gray-900/70 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" /> {t('home.hero.badge')}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              {t('home.hero.title.prefix')}{' '}
              <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                {t('home.hero.title.brand')}
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              {t('home.hero.subtitle')}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40"
              >
                {t('home.hero.cta.shop')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/products?category=Electronics"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-7 py-3 text-base font-semibold text-gray-800 shadow-sm backdrop-blur transition hover:bg-white dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-100 dark:hover:bg-gray-900"
              >
                {t('home.hero.cta.browse')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.titleKey}
                className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30 dark:hover:shadow-black/50"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {t(f.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {t(f.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <CategoryShowcase />

      {/* Top Customer Reviews */}
      <TopReviews />
    </div>
  );
}
