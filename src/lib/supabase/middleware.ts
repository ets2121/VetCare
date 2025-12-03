import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      db: {
        schema: 'public',
      },
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Define public routes that are always accessible
  const publicRoutes = ['/login', '/signup', '/admin/login', '/auth/confirm'];

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = userData?.role;

    // If user is logged in, redirect them from auth pages to the appropriate dashboard
    if (publicRoutes.includes(pathname)) {
        if (userRole === 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/super-admin/dashboard', request.url))
        }
        if (userRole === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        }
        if (userRole === 'CUSTOMER') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Role-based route protection for protected routes
    if (pathname.startsWith('/admin') && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (pathname.startsWith('/super-admin') && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    if (pathname.startsWith('/dashboard') && userRole !== 'CUSTOMER') {
       if (userRole === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/super-admin/dashboard', request.url))
      }
       if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    }

  } else {
    // If user is not logged in, protect all routes except public ones
    const isProtectedRoute = !publicRoutes.includes(pathname) && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/super-admin'));
    if (isProtectedRoute) {
        let loginUrl = '/login';
        if (pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) {
            loginUrl = '/admin/login';
        }
        return NextResponse.redirect(new URL(loginUrl, request.url));
    }
  }

  return response
}
