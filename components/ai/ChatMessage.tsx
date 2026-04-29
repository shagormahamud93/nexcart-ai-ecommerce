'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, ShoppingBag, Star } from 'lucide-react';
import type { ChatMessage as ChatMessageType, ToolEvent } from './types';

function formatPrice(n: number) {
  return `$${n.toFixed(2)}`;
}

type ProductCard = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  url: string;
  rating?: number;
};

function ProductGrid({
  products,
  onAdd,
}: {
  products: ProductCard[];
  onAdd: (productId: string) => void;
}) {
  if (!products.length) return null;
  return (
    <div className="mt-2.5 grid grid-cols-1 gap-2">
      {products.slice(0, 6).map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.04 }}
          className="group rounded-2xl border border-gray-200/80 bg-white p-2.5 flex gap-2.5 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <Link href={p.url} className="shrink-0">
            <div className="w-16 h-16 rounded-xl bg-linear-to-br from-gray-100 to-gray-50 overflow-hidden relative">
              {p.image ? (
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="64px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <Link
                href={p.url}
                className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug hover:text-indigo-600"
              >
                {p.name}
              </Link>
              {p.rating != null && p.rating > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5 text-[10px] text-gray-500">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>{p.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-bold text-gray-900">{formatPrice(p.price)}</span>
              <button
                onClick={() => onAdd(p.id)}
                className="text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CartSummary({
  items,
  total,
}: {
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
  total: number;
}) {
  if (!items.length) {
    return (
      <div className="mt-2.5 rounded-2xl border border-dashed border-gray-300 bg-white p-3 text-xs text-gray-500 italic text-center">
        Your cart is empty.
      </div>
    );
  }
  return (
    <div className="mt-2.5 rounded-2xl border border-gray-200 bg-white p-3 text-xs shadow-sm">
      <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        <ShoppingBag className="w-3 h-3" />
        Your cart
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex justify-between text-gray-700">
            <span className="truncate pr-2">
              <span className="text-gray-400">{it.quantity}×</span> {it.name}
            </span>
            <span className="font-semibold text-gray-900">{formatPrice(it.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-gray-100 mt-2.5 pt-2 flex justify-between font-bold text-gray-900">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}

function OrderList({
  orders,
}: {
  orders: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
    itemCount: number;
    url: string;
  }>;
}) {
  if (!orders.length) {
    return (
      <div className="mt-2.5 rounded-2xl border border-dashed border-gray-300 bg-white p-3 text-xs text-gray-500 italic text-center">
        No orders yet.
      </div>
    );
  }
  return (
    <div className="mt-2.5 space-y-1.5">
      {orders.map((o, i) => (
        <motion.div
          key={o.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: i * 0.04 }}
        >
          <Link
            href={o.url}
            className="block rounded-2xl border border-gray-200 bg-white p-2.5 text-xs hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900 font-mono text-[11px]">
                #{o.id.slice(-8).toUpperCase()}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(o.status)}`}>
                {o.status}
              </span>
            </div>
            <div className="text-gray-500 mt-1 flex justify-between items-center">
              <span>{o.itemCount} item{o.itemCount === 1 ? '' : 's'} · {new Date(o.createdAt).toLocaleDateString()}</span>
              <span className="font-bold text-gray-900 text-sm">{formatPrice(o.total)}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
      return 'bg-green-100 text-green-700';
    case 'SHIPPED':
      return 'bg-blue-100 text-blue-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
}

function ToolBadge({ event }: { event: ToolEvent }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-1.5 text-[11px] text-gray-500 italic mt-1"
    >
      <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
      <span>{labelFor(event.name)}</span>
    </motion.div>
  );
}

function labelFor(name: string) {
  switch (name) {
    case 'searchProducts':
      return 'Searching products…';
    case 'getProductById':
      return 'Loading product…';
    case 'getRecommendations':
      return 'Finding recommendations…';
    case 'getCart':
      return 'Reading cart…';
    case 'addToCart':
      return 'Adding to cart…';
    case 'updateCartQuantity':
      return 'Updating cart…';
    case 'removeFromCart':
      return 'Removing from cart…';
    case 'clearCart':
      return 'Clearing cart…';
    case 'getOrders':
      return 'Loading orders…';
    case 'getOrderById':
      return 'Loading order…';
    case 'navigate':
      return 'Navigating…';
    default:
      return `Running ${name}…`;
  }
}

export function ChatMessageView({
  message,
  onAddToCart,
}: {
  message: ChatMessageType;
  onAddToCart: (productId: string) => void;
}) {
  const isUser = message.role === 'user';
  const isEmpty = !message.content && !message.tools?.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div className={`flex flex-col max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
        {(message.content || (!isUser && message.streaming && isEmpty)) && (
          <div
            className={`px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
              isUser
                ? 'bg-linear-to-br from-indigo-600 to-violet-600 text-white rounded-3xl rounded-br-md'
                : message.errored
                ? 'bg-red-50 text-red-800 border border-red-200 rounded-3xl rounded-bl-md'
                : 'bg-white text-gray-800 border border-gray-200/80 rounded-3xl rounded-bl-md'
            }`}
          >
            {message.content && (
              <div className="whitespace-pre-wrap wrap-break-word">
                {message.content}
                {!isUser && message.streaming && (
                  <motion.span
                    className="inline-block w-1.5 h-4 align-[-2px] ml-0.5 bg-indigo-500 rounded-sm"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </div>
            )}
            {!isUser && message.streaming && isEmpty && <TypingDots />}
          </div>
        )}

        {!isUser && message.tools && message.tools.length > 0 && (
          <div className="w-full">
            {message.tools.map((t, i) => {
              if (t.status === 'pending') return <ToolBadge key={i} event={t} />;
              return renderToolResult(t, onAddToCart, i);
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center py-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400"
          animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
}

function renderToolResult(
  t: ToolEvent,
  onAdd: (id: string) => void,
  key: number
) {
  if (!t.result || !t.result.ok) return null;
  const data = t.result.data as Record<string, unknown> | undefined;
  if (!data) return null;

  if (t.name === 'searchProducts' || t.name === 'getRecommendations') {
    const products = (data.products || data.recommendations) as ProductCard[] | undefined;
    if (products?.length) {
      return <ProductGrid key={key} products={products} onAdd={onAdd} />;
    }
  }

  if (t.name === 'getProductById') {
    const p = data as ProductCard;
    return <ProductGrid key={key} products={[p]} onAdd={onAdd} />;
  }

  if (t.name === 'getCart') {
    const items = (data.items as Array<{
      name: string;
      quantity: number;
      lineTotal: number;
    }>) || [];
    return <CartSummary key={key} items={items} total={(data.total as number) || 0} />;
  }

  if (t.name === 'getOrders') {
    const orders = (data.orders as Parameters<typeof OrderList>[0]['orders']) || [];
    return <OrderList key={key} orders={orders} />;
  }

  return null;
}
