import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware for Route Protection
 * 
 * Protects all routes by checking for the auth.sid cookie.
 * Redirects unauthenticated users to the signin page.
 * 
 * SECURITY NOTES:
 * - Only checks cookie presence (fast, no network call)
 * - Actual session validation happens server-side in components/API routes
 * - Cookie is HttpOnly, Secure, SameSite=Lax (set by gateway)
 */

// Paths that should NOT be protected
const PUBLIC_PATHS = [
  '/auth/signin',
  '/auth/callback',
  '/auth/signout',
  '/api/auth/verify', // Auth verification API is public (returns 401 if not authenticated)
]

// Static asset paths to always exclude
const STATIC_PATHS = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/_pagefind',
  '/images',
  '/icons',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets (performance optimization)
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Skip file extensions (assets, images, etc.)
  if (pathname.match(/\.[a-zA-Z0-9]+$/)) {
    return NextResponse.next()
  }

  // Allow public auth paths
  if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next()
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('auth.sid')

  if (!authCookie || !authCookie.value) {
    // No auth cookie - redirect to signin
    const signinUrl = new URL('/auth/signin', request.url)
    
    // Save the original destination for redirect after login
    signinUrl.searchParams.set('callbackUrl', pathname)
    
    return NextResponse.redirect(signinUrl)
  }

  // Auth cookie exists - allow request
  // Actual session validation happens in server components/API routes
  return NextResponse.next()
}

export const config = {
  /*
   * Match all paths except:
   * - _next (Next.js internals)
   * - Static files with extensions
   */
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
}
