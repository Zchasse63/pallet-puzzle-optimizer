import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware for handling authentication and routing
 * Runs before every request to check authentication status
 * 
 * @param request - The incoming request object
 * @returns NextResponse with appropriate redirects or the original response
 */
export async function middleware(request: NextRequest) {
  try {
    // Create a response object that we'll modify and return
    const res = NextResponse.next();
    
    // Create a Supabase client specifically for middleware use
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => request.cookies.get(name)?.value,
          set: (name, value, options) => {
            res.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove: (name, options) => {
            res.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            });
          },
        },
      }
    );
    
    // Get the current session (this will refresh the session if needed)
    const { data: { session } } = await supabase.auth.getSession();

    // Extract pathname and search params from the request URL
    const { pathname, searchParams } = request.nextUrl;
    const returnUrl = searchParams.get('returnUrl') || '/dashboard';

    // Define route patterns for different access levels
    const publicRoutes = [
      '/', 
      '/login', 
      '/register', 
      '/reset-password',
      '/update-password',
      '/about',
      '/contact',
      '/privacy-policy',
      '/terms-of-service'
    ];
    
    const authRoutes = [
      '/login', 
      '/register', 
      '/reset-password',
      '/update-password'
    ];
    
    const protectedRoutes = [
      '/dashboard',
      '/profile',
      '/quotes',
      '/products',
      '/settings'
    ];

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );
    
    // Check if the current path is an auth route
    const isAuthRoute = authRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );

    // Handle protected routes - redirect to login if not authenticated
    if (isProtectedRoute && !session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      
      // Set a cookie to indicate the user was redirected due to auth
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.set('auth_redirect', 'true', { 
        path: '/',
        maxAge: 60, // Short-lived cookie
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      
      return redirectResponse;
    }

    // Handle auth routes - redirect to dashboard if already authenticated
    if (isAuthRoute && session) {
      // If there's a specific return URL, use that instead of dashboard
      const targetUrl = returnUrl && returnUrl !== '/' && !authRoutes.includes(returnUrl)
        ? returnUrl
        : '/dashboard';
        
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }

    // For all other cases, continue with the request
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // In case of an error, allow the request to continue
    // The application can handle auth errors appropriately
    return NextResponse.next();
  }
}

/**
 * Configure which paths the middleware should run on
 * Excludes static assets, API routes, and Next.js internal routes
 */
export const config = {
  matcher: [
    // Match all pages except public files, api routes, and Next.js internal routes
    '/((?!api|_next/static|_next/image|favicon\.ico).*)',
  ],
};
