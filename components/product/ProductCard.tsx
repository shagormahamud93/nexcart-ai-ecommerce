import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

interface ProductBadges {
  isNew: boolean;
  isOutOfStock: boolean;
  isDiscount: boolean;
  isHot: boolean;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    oldPrice?: number | null;
    images: string[];
    rating: number;
    reviewCount: number;
    badges?: ProductBadges;
  };
}

const BADGE_STYLES = {
  new: 'bg-emerald-500 text-white',
  out: 'bg-red-500 text-white',
  hot: 'bg-orange-500 text-white',
  discount: 'bg-gradient-to-r from-yellow-400 to-red-500 text-white',
} as const;

function BadgeChip({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm ${className}`}
    >
      {label}
    </span>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const badges = product.badges;
  const discountPct =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

  return (
    <Link href={`/product/${product.id}`} className="group h-full">
      <div className="h-full bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow dark:bg-gray-900 dark:border-gray-800 dark:shadow-black/30 dark:hover:shadow-black/50">

        <div className="relative h-48 bg-gray-200 dark:bg-gray-800">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
              No Image
            </div>
          )}

          {badges && (
            <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10 pointer-events-none">
              {badges.isOutOfStock && (
                <BadgeChip label="Out of stock" className={BADGE_STYLES.out} />
              )}

              {badges.isDiscount && (
                <BadgeChip
                  label={discountPct ? `-${discountPct}%` : 'Sale'}
                  className={BADGE_STYLES.discount}
                />
              )}

              {badges.isNew && !badges.isOutOfStock && (
                <BadgeChip label="New" className={BADGE_STYLES.new} />
              )}

              {badges.isHot && !badges.isOutOfStock && (
                <BadgeChip label="Hot" className={BADGE_STYLES.hot} />
              )}
            </div>
          )}
        </div>

        <div className="p-4 min-h-[180px] flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 dark:text-white">
            {product.name}
          </h3>

          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 dark:text-gray-600'
                    }`}
                />
              ))}
            </div>

            <span className="text-sm text-gray-600 ml-2 dark:text-gray-400">
              ({product.reviewCount})
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-auto">
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </p>

            {product.oldPrice && product.oldPrice > product.price && (
              <p className="text-sm text-gray-400 line-through dark:text-gray-500">
                ${product.oldPrice.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
