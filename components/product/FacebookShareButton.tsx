'use client';

import { useState } from 'react';

type FacebookShareButtonProps = {
  /**
   * Either a full absolute URL (https://…) or a path starting with `/`.
   * Path-only values are resolved against NEXT_PUBLIC_APP_URL when set,
   * otherwise against window.location.origin at click time.
   */
  url: string;
  className?: string;
  label?: string;
  /** Open in a popup (default) vs. a new tab. */
  popup?: boolean;
};

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL;

function resolveAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = SITE_URL?.replace(/\/+$/, '') || window.location.origin;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

export function FacebookShareButton({
  url,
  className,
  label = 'Share on Facebook',
  popup = true,
}: FacebookShareButtonProps) {
  const [busy, setBusy] = useState(false);

  function handleClick() {
    setBusy(true);
    try {
      const absolute = resolveAbsoluteUrl(url);
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absolute)}`;
      if (popup && typeof window !== 'undefined') {
        const w = 600;
        const h = 540;
        const left = Math.max(0, (window.screen.width - w) / 2);
        const top = Math.max(0, (window.screen.height - h) / 2);
        const opened = window.open(
          shareUrl,
          'fb-share',
          `popup=yes,width=${w},height=${h},left=${left},top=${top},noopener,noreferrer`,
        );
        if (!opened) {
          // Popup blocked — fall back to a new tab.
          window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={label}
      title={label}
      className={
        className ??
        'inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-[#1877F2] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#166FE0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1877F2] disabled:opacity-60'
      }
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        focusable="false"
        fill="currentColor"
      >
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.43-4.92 8.43-9.94Z" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
