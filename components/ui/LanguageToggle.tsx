'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

type Props = {
  className?: string;
};

export function LanguageToggle({ className = '' }: Props) {
  const { lang, toggleLang, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const display = mounted ? (lang === 'en' ? 'EN' : 'BN') : 'EN';
  const aria = t('lang.toggle.aria');

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={aria}
      title={aria}
      className={`grid h-10 min-w-10 place-items-center rounded-full px-2.5 text-xs font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-indigo-400 ${className}`}
    >
      {display}
    </button>
  );
}
