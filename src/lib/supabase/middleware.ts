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

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = userData?.role;

    // Logged-in users should not see auth pages
    if (pathname === '/login' || pathname === '/signup' || pathname === '/admin/login') {
      if (userRole === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/super-admin/dashboard', request.url))
      }
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Role-based route protection
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
    // Logged-out users are redirected to login pages if trying to access protected routes
    const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/super-admin');
    if (isProtected) {
      const url = pathname.startsWith('/admin') || pathname.startsWith('/super-admin') ? '/admin/login' : '/login';
      return NextResponse.redirect(new URL(url, request.url))
    }
  }

  return response
}
