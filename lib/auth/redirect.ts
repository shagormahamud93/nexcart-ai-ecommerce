// Shared helpers for the post-login return-to flow ("?next=").
//
// Producers (proxy, client guards) build login URLs with `loginUrlFor`.
// Consumers (login/register pages) sanitize the incoming `next` param with
// `safeRedirectTarget` before navigating — open-redirect protection.

const LOOP_PREFIXES = ['/login', '/register'];

/**
 * Validate a return-to path. Rejects anything that could be used as an
 * open-redirect (absolute URLs, protocol-relative `//evil.com`, backslash
 * tricks, login/register itself which would loop).
 */
export function safeRedirectTarget(raw: string | null | undefined): string {
  if (!raw) return '/';
  if (typeof raw !== 'string') return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  if (raw.includes('\\')) return '/';
  for (const prefix of LOOP_PREFIXES) {
    if (raw === prefix || raw.startsWith(`${prefix}?`) || raw.startsWith(`${prefix}/`)) {
      return '/';
    }
  }
  return raw;
}

/**
 * Build a login URL that returns the user to `target` after sign-in.
 * Falls back to bare `/login` if `target` is the home page.
 */
export function loginUrlFor(target: string): string {
  const safe = safeRedirectTarget(target);
  if (safe === '/') return '/login';
  return `/login?next=${encodeURIComponent(safe)}`;
}
