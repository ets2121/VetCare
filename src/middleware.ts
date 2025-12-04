import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const { user_id, role, isLoggedIn } = session;
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/signup', '/admin/login', '/auth/confirm'];

  if (isLoggedIn) {
    if (publicRoutes.includes(pathname)) {
      if (role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
      }
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (role === 'CUSTOMER') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (pathname.startsWith('/super-admin') && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (pathname.startsWith('/dashboard') && role !== 'CUSTOMER') {
        if (role === 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
        }
        if (role === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
    }

  } else {
    const isProtectedRoute = !publicRoutes.includes(pathname) &&
                             (pathname.startsWith('/dashboard') || 
                              pathname.startsWith('/admin') || 
                              pathname.startsWith('/super-admin'));
    
    if (isProtectedRoute) {
        let loginUrl = '/login';
        if (pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) {
            loginUrl = '/admin/login';
        }
        return NextResponse.redirect(new URL(loginUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
