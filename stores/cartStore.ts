import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
  };
}

interface CartState {
  items: CartItem[];
  total: number;
  isLoading: boolean;
  error: string | null;

  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  clearError: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      isLoading: false,
      error: null,

      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/cart');
          if (!response.ok) {
            if (response.status === 401) {
              // Not authenticated, clear cart
              set({ items: [], total: 0, isLoading: false });
              return;
            }
            throw new Error('Failed to fetch cart');
          }

          const data = await response.json();
          set({
            items: data.items,
            total: data.total,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      addToCart: async (productId: string, quantity = 1) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add to cart');
          }

          const data = await response.json();
          set({
            items: data.items,
            total: data.total,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
          throw error;
        }
      },

      updateCartItem: async (itemId: string, quantity: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/cart/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update cart item');
          }

          const data = await response.json();
          set({
            items: data.items,
            total: data.total,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
          throw error;
        }
      },

      removeCartItem: async (itemId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/cart/items/${itemId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to remove cart item');
          }

          const data = await response.json();
          set({
            items: data.items,
            total: data.total,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
          throw error;
        }
      },

      clearCart: () => set({ items: [], total: 0 }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items, total: state.total }),
    }
  )
);