'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import toast from 'react-hot-toast';
import { useT } from '@/components/providers/LanguageProvider';

interface CartItemProps {
  item: {
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
  };
}

export function CartItemComponent({ item }: CartItemProps) {
  const { updateCartItem, removeCartItem, isLoading } = useCartStore();
  const t = useT();

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > item.product.stock) {
      toast.error(t('cart.toast.outOfStock'));
      return;
    }

    try {
      await updateCartItem(item.id, newQuantity);
      toast.success(t('cart.toast.updated'));
    } catch (error) {
      // Error handled in store
    }
  };

  const handleRemove = async () => {
    try {
      await removeCartItem(item.id);
      toast.success(t('cart.toast.removed'));
    } catch (error) {
      // Error handled in store
    }
  };

  const subtotal = item.product.price * item.quantity;

  return (
    <div className="flex items-center space-x-4 py-4 border-b border-gray-200 dark:border-gray-800 px-6">
      <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden dark:bg-gray-800">
        {item.product.images[0] ? (
          <Image
            src={item.product.images[0]}
            alt={item.product.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs dark:text-gray-500">
            {t('cart.item.noImg')}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate dark:text-white">
          {item.product.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ${item.product.price.toFixed(2)} {t('cart.item.each')}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={isLoading || item.quantity <= 1}
          className="p-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Minus className="w-4 h-4" />
        </button>

        <span className="text-sm font-medium w-8 text-center text-gray-900 dark:text-white">
          {item.quantity}
        </span>

        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={isLoading || item.quantity >= item.product.stock}
          className="p-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="text-sm font-medium text-gray-900 w-20 text-right dark:text-white">
        ${subtotal.toFixed(2)}
      </div>

      <button
        onClick={handleRemove}
        disabled={isLoading}
        className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50 transition dark:text-red-400 dark:hover:text-red-300"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}