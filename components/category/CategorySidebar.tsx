'use client';

import { useEffect } from 'react';
import * as Icons from 'lucide-react';
import { LayoutGrid, type LucideIcon } from 'lucide-react';
import { useCategoryStore } from '@/stores/categoryStore';

function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return LayoutGrid;
  const lib = Icons as unknown as Record<string, LucideIcon>;
  return lib[name] ?? LayoutGrid;
}

interface CategorySidebarProps {
  activeSlug: string;
  onSelect: (slug: string) => void;
  className?: string;
  showCounts?: boolean;
}

export function CategorySidebar({
  activeSlug,
  onSelect,
  className = '',
  showCounts = true,
}: CategorySidebarProps) {
  const { categories, totalProducts, isLoading, fetchCategories } =
    useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const isAll = activeSlug === '';

  return (
    <aside
      className={`flex h-full flex-col gap-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900 ${className}`}
      aria-label="Product categories"
    >
      <div className="px-3 pb-2 pt-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Categories
        </h2>
      </div>

      <CategoryRow
        icon={LayoutGrid}
        label="All Products"
        count={showCounts ? totalProducts : null}
        active={isAll}
        onClick={() => onSelect('')}
      />

      <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

      {isLoading && categories.length === 0 ? (
        <div className="space-y-2 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : (
        categories.map((cat) => {
          const Icon = resolveIcon(cat.icon);
          const active = activeSlug === cat.slug;
          return (
            <CategoryRow
              key={cat.slug}
              icon={Icon}
              label={cat.name}
              count={showCounts ? cat.productCount : null}
              active={active}
              onClick={() => onSelect(cat.slug)}
            />
          );
        })
      )}
    </aside>
  );
}

function CategoryRow({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count: number | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/15 dark:text-indigo-300'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
          active
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-600 group-hover:bg-white dark:bg-gray-800 dark:text-gray-300 dark:group-hover:bg-gray-700'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== null && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            active
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
