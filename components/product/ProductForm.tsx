'use client';

import { useState } from 'react';
import { useProductStore } from '@/stores/productStore';
import toast from 'react-hot-toast';
import { Plus, Trash2, Loader2, Package, DollarSign, Boxes, ImageIcon } from 'lucide-react';

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    stock: number;
  };
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    category: product?.category || '',
    images: product?.images || [''],
    stock: product?.stock || 0,
  });

  const { createProduct, updateProduct, isLoading } = useProductStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        images: formData.images.filter(img => img.trim() !== ''),
      };

      if (product) {
        await updateProduct(product.id, data);
        toast.success('Product updated successfully');
      } else {
        await createProduct(data);
        toast.success('Product created successfully');
      }

      onSuccess?.();
    } catch (error) {
      // Error is handled in store
    }
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ''],
    }));
  };

  const updateImage = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img),
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const inputClass =
    'block w-full h-11 px-3.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-gray-400';

  const labelClass = 'block text-sm font-medium text-gray-800 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <Package className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
        </header>
        <div className="p-6 space-y-5">
          <div>
            <label htmlFor="name" className={labelClass}>
              Product Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Wireless Bluetooth Headphones"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Description
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the product, key features, materials, etc."
              className="block w-full px-3.5 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-gray-400 resize-y"
            />
          </div>

          <div>
            <label htmlFor="category" className={labelClass}>
              Category
            </label>
            <input
              type="text"
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="e.g. Electronics, Clothing, Home"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Pricing & Inventory */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <DollarSign className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">Pricing & Inventory</h2>
        </header>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="price" className={labelClass}>
                Price
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 text-sm">
                  $
                </span>
                <input
                  type="number"
                  id="price"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className={`${inputClass} pl-7`}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">Selling price in USD</p>
            </div>

            <div>
              <label htmlFor="stock" className={labelClass}>
                Stock
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Boxes className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  id="stock"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">Available units in inventory</p>
            </div>
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">Images</h2>
          </div>
          <span className="text-xs text-gray-500">
            {formData.images.filter(i => i.trim() !== '').length} added
          </span>
        </header>
        <div className="p-6 space-y-3">
          {formData.images.map((image, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => updateImage(index, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={inputClass}
                />
              </div>
              {formData.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label="Remove image"
                  className="inline-flex items-center justify-center h-11 w-11 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addImageField}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition"
          >
            <Plus className="w-4 h-4" />
            Add another image
          </button>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 min-w-40 h-11 px-5 rounded-lg text-sm font-semibold text-white bg-indigo-600 shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>{product ? 'Update Product' : 'Create Product'}</>
          )}
        </button>
      </div>
    </form>
  );
}
