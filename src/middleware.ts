import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const { isLoggedIn, role } = session;
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/', '/login', '/signup', '/admin/login'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname === '/auth/confirm';

  const customerDashboard = '/dashboard';
  const adminDashboard = '/admin/dashboard';
  const superAdminDashboard = '/super-admin/dashboard';

  if (isLoggedIn) {
    // If logged in, determine the correct dashboard
    let userDashboard = '/';
    if (role === 'CUSTOMER') userDashboard = customerDashboard;
    if (role === 'ADMIN') userDashboard = adminDashboard;
    if (role === 'SUPER_ADMIN') userDashboard = superAdminDashboard;

    // If logged-in user is trying to access a public page (like /login), redirect to their dashboard
    if (isPublicRoute) {
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }

    // Role-based access control for protected routes
    if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL(customerDashboard, request.url));
    }
    if (pathname.startsWith('/super-admin') && role !== 'SUPER_ADMIN') {
      // Redirect non-super-admins away from super-admin routes
       return NextResponse.redirect(new URL(role === 'ADMIN' ? adminDashboard : customerDashboard, request.url));
    }
    if (pathname.startsWith('/dashboard') && role !== 'CUSTOMER') {
      // Redirect non-customers away from the customer dashboard
      return NextResponse.redirect(new URL(role === 'ADMIN' ? adminDashboard : superAdminDashboard, request.url));
    }
  } else {
    // If not logged in, protect non-public routes
    const isProtectedRoute = !isPublicRoute;
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
