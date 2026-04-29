import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

// Build an absolute /login URL with ?next= so the login page can return the
// user where they were trying to go. Skips ?next= for the home page.
function loginRedirect(request: NextRequest, returnPath: string) {
  const url = new URL('/login', request.url);
  if (returnPath && returnPath !== '/') {
    url.searchParams.set('next', returnPath);
  }
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const returnPath = pathname + (search || '');

  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  const userRoutes = ['/profile', '/orders', '/checkout', '/wishlist'];
  const isUserRoute = userRoutes.some((route) => pathname.startsWith(route));

  const token = request.cookies.get('token')?.value;

  if (isAdminRoute) {
    if (!token) {
      return loginRedirect(request, returnPath);
    }
    try {
      const payload = verifyToken(token);
      if (payload.role !== 'ADMIN') {
        // Role mismatch — send to home; we don't want them looping back here.
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      return loginRedirect(request, returnPath);
    }
  }

  if (isUserRoute) {
    if (!token) {
      return loginRedirect(request, returnPath);
    }
    try {
      verifyToken(token);
    } catch {
      return loginRedirect(request, returnPath);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
