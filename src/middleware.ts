
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLE_PAGE_ACCESS, ROLE_API_ACCESS, PUBLIC_API_ROUTES, PROTECTED_API_PREFIX, PUBLIC_PAGES, PROTECTED_PAGE_PREFIXES } from '@/lib/routes';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('vetconnect-session');

  // Allow public APIs
  if (PUBLIC_API_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Protect API
  if (pathname.startsWith(PROTECTED_API_PREFIX)) {
    if (!sessionCookie) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Check role access
    const session = await getSession();
    const allowedApis = ROLE_API_ACCESS[session.role || ''] || [];
    if (!allowedApis.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
  }

  // Protect Pages
  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedPage) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // ✅ Check role
    const session = await getSession();
    const allowedPages = ROLE_PAGE_ACCESS[session.role || ''] || [];
    if (!allowedPages.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/branches/:path*', '/appointments/:path*', '/super-admin/:path*'],
};
