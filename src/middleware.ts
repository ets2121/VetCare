import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  PUBLIC_API_ROUTES,
  PROTECTED_API_PREFIX,
} from '@/lib/routes';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public API routes
  if (PUBLIC_API_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Protect API routes
  if (pathname.startsWith(PROTECTED_API_PREFIX)) {
    const sessionCookie = request.cookies.get('vetconnect-session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// 👇 DITO MO MAKIKITA YUNG SINASABI KO
export const config = {
  matcher: ['/api/:path*'],
};
