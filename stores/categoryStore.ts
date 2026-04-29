import { create } from 'zustand';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  description: string | null;
  productCount: number;
}

interface CategoryState {
  categories: Category[];
  totalProducts: number;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchCategories: (force?: boolean) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  totalProducts: 0,
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchCategories: async (force = false) => {
    if (!force && (get().hasFetched || get().isLoading)) return;
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      set({
        categories: data.categories,
        totalProducts: data.totalProducts,
        isLoading: false,
        hasFetched: true,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },
}));
