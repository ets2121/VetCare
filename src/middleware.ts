import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const { isLoggedIn, role } = session;
  const { pathname } = request.nextUrl;

  // Allow API routes to be accessed without authentication checks
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/admin/login');

  if (isLoggedIn) {
    let userDashboard = '/';
    if (role === 'CUSTOMER') userDashboard = '/dashboard';
    if (role === 'ADMIN') userDashboard = '/admin/dashboard';
    if (role === 'SUPER_ADMIN') userDashboard = '/super-admin/dashboard';
    
    // If logged in user tries to access an auth page, redirect to their dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }
     if (pathname === '/') {
        return NextResponse.redirect(new URL(userDashboard, request.url));
    }

    // Role-based access control for protected routes
    const isCustomerDashboard = pathname.startsWith('/dashboard');
    const isAdminDashboard = pathname.startsWith('/admin/dashboard');
    const isSuperAdminDashboard = pathname.startsWith('/super-admin/dashboard');

    if (isCustomerDashboard && role !== 'CUSTOMER') {
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }
    if (isAdminDashboard && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }
    if (isSuperAdminDashboard && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL(userDashboard, request.url));
    }

  } else {
    // If not logged in, and trying to access a protected page, redirect to login
    const isProtectedRoute = !isAuthPage && pathname !== '/';
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
