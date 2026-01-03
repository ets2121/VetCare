import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  PUBLIC_API_ROUTES,
  PROTECTED_API_PREFIX,
  PUBLIC_PAGES,
  PROTECTED_PAGE_PREFIXES,
} from '@/lib/routes';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('vetconnect-session');

  /* =========================
     API PROTECTION
  ========================= */

  if (PUBLIC_API_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith(PROTECTED_API_PREFIX)) {
    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  /* =========================
     PAGE PROTECTION
  ========================= */

  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedPage && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/* 👇 WHEN middleware runs */
export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/branches/:path*', '/appointments/:path*', '/super-admin/:path*'],
};
