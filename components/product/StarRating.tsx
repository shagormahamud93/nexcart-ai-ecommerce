'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = 20,
  readOnly = false,
  className = '',
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display;
        const Component = readOnly ? 'span' : 'button';
        return (
          <Component
            key={n}
            type={readOnly ? undefined : 'button'}
            onClick={readOnly ? undefined : () => onChange?.(n)}
            onMouseEnter={readOnly ? undefined : () => setHover(n)}
            onMouseLeave={readOnly ? undefined : () => setHover(0)}
            className={
              readOnly
                ? 'inline-flex'
                : 'inline-flex cursor-pointer rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
            }
            aria-label={readOnly ? undefined : `Rate ${n} stars`}
          >
            <Star
              style={{ width: size, height: size }}
              className={
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }
            />
          </Component>
        );
      })}
    </div>
  );
}
