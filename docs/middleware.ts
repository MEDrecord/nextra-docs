import { NextResponse, type NextRequest } from 'next/server'
import { isCrossDomainModeFromHost } from './lib/auth/config'

/**
 * Middleware for Route Protection
 * 
 * Supports TWO authentication modes:
 * 1. Cookie mode (same-domain): Checks for auth.sid cookie
 * 2. SessionId mode (cross-domain): Checks for X-Session-Id header
 * 
 * In cross-domain mode, since localStorage is only accessible client-side,
 * the middleware cannot check sessionId directly. Instead, we allow the request
 * through and let client-side code handle the redirect if needed.
 * 
 * SECURITY NOTES:
 * - Only checks credential presence (fast, no network call)
 * - Actual session validation happens server-side in components/API routes
 * - Cookie is HttpOnly, Secure, SameSite=Lax (set by gateway)
 */

// Paths that should NOT be protected
const PUBLIC_PATHS = [
  '/auth/signin',
  '/auth/callback',
  '/auth/signout',
  '/api/auth/verify',
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
  const { pathname, hostname } = request.nextUrl
  const isCrossDomain = isCrossDomainModeFromHost(hostname)

  // Skip static assets (performance optimization)
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Add caching headers for ISMS pages (embedded in Helpdesk)
  // This reduces latency for repeated page loads
  if (pathname.startsWith('/isms')) {
    const response = NextResponse.next()
    
    // Cache ISMS pages for 5 minutes, allow stale content while revalidating
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    // Also set CORS headers for cross-origin embedding
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    
    return response
  }

  // Skip file extensions (assets, images, etc.)
  if (pathname.match(/\.[a-zA-Z0-9]+$/)) {
    return NextResponse.next()
  }

  // Allow public auth paths
  if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next()
  }

  if (isCrossDomain) {
    // Cross-domain mode: Check for X-Session-Id header
    // Note: For initial page loads, sessionId is in localStorage (client-side only)
    // The AuthContext will handle redirect if session is invalid
    // For API requests, the header should be present
    const sessionIdHeader = request.headers.get('x-session-id')
    
    // For page requests (not API), we can't check localStorage from middleware
    // Let the request through and rely on client-side AuthContext for protection
    if (pathname.startsWith('/api/') && !sessionIdHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // For non-API routes in cross-domain mode, allow through
    // Client-side AuthContext will handle redirect if not authenticated
    return NextResponse.next()
  } else {
    // Same-domain mode: Check for auth cookie
    const authCookie = request.cookies.get('auth.sid')

    if (!authCookie || !authCookie.value) {
      // No auth cookie - redirect to signin
      const signinUrl = new URL('/auth/signin', request.url)
      
      // Save the original destination for redirect after login
      signinUrl.searchParams.set('callbackUrl', pathname)
      
      return NextResponse.redirect(signinUrl)
    }
  }

  // Auth credentials exist - allow request
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
}
