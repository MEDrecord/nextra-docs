import { NextResponse, type NextRequest } from 'next/server'
import { isCrossDomainModeFromHost, GATEWAY_URL } from './lib/auth/config'

/**
 * Middleware for Route Protection with ISMS RBAC
 * 
 * Supports TWO authentication modes:
 * 1. Cookie mode (same-domain): Checks for auth.sid cookie
 * 2. SessionId mode (cross-domain): Checks for X-Session-Id header
 * 
 * ISMS Access Control:
 * - ISMS_PUBLIC_PATHS: Accessible by ALL authenticated users (awareness, procedures)
 * - ISMS_RESTRICTED_PATHS: Accessible ONLY by tenant_admin (risks, audit, registers)
 * - All other ISMS paths: Default to restricted (fail-secure)
 * 
 * SECURITY NOTES:
 * - Default-deny: If ISMS path not explicitly public, it's restricted
 * - Role check via Gateway API for restricted paths
 * - Cookie is HttpOnly, Secure, SameSite=Lax (set by gateway)
 */

// Paths that should NOT be protected (no auth required)
const PUBLIC_PATHS = [
  '/auth/signin',
  '/auth/callback',
  '/auth/signout',
  '/api/auth/verify',
]

// ISMS paths accessible by ALL authenticated users
const ISMS_PUBLIC_PATHS = [
  '/isms/awareness',
  '/isms/procedures',
  '/isms/report-incident',
  '/isms/policies',
]

// ISMS paths that require tenant_admin role
// NOTE: Any ISMS path NOT in ISMS_PUBLIC_PATHS is automatically restricted
const ISMS_RESTRICTED_PATHS = [
  '/isms/risks',
  '/isms/registers',
  '/isms/audit',
  '/isms/annex-a',
  '/isms/checklist',
  '/isms/admin',
]

/**
 * Check if user has required role by calling Gateway
 * Returns user object if authorized, null if not
 */
async function verifyUserRole(request: NextRequest): Promise<{ role: string } | null> {
  try {
    const authCookie = request.cookies.get('auth.sid')
    if (!authCookie?.value) return null

    const response = await fetch(`${GATEWAY_URL}/api/user/me`, {
      headers: {
        'Cookie': `auth.sid=${authCookie.value}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.user || null
  } catch {
    return null
  }
}

/**
 * Check if path is an ISMS restricted path
 */
function isISMSRestrictedPath(pathname: string): boolean {
  // If it's an ISMS path but NOT in public paths, it's restricted
  if (pathname.startsWith('/isms')) {
    return !ISMS_PUBLIC_PATHS.some(path => 
      pathname === path || pathname.startsWith(path + '/')
    )
  }
  return false
}

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

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl
  const isCrossDomain = isCrossDomainModeFromHost(hostname)

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

  if (isCrossDomain) {
    // Cross-domain mode: Check for X-Session-Id header
    // Note: For initial page loads, sessionId is in localStorage (client-side only)
    // The AuthContext will handle redirect if session is invalid
    // For API requests, the header should be present
    const sessionIdHeader = request.headers.get('x-session-id')
    
    // SECURITY: Block restricted ISMS paths in cross-domain mode
    // These should only be accessible from same-domain (*.healthtalk.ai)
    if (isISMSRestrictedPath(pathname)) {
      return NextResponse.json(
        { error: 'ISMS restricted content requires same-domain access' },
        { status: 403 }
      )
    }
    
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
    
    // ISMS RBAC: Check role for restricted paths
    if (isISMSRestrictedPath(pathname)) {
      const user = await verifyUserRole(request)
      
      // Fail-secure: If we can't verify role, deny access
      if (!user) {
        const accessDeniedUrl = new URL('/isms/access-denied', request.url)
        accessDeniedUrl.searchParams.set('reason', 'auth_failed')
        return NextResponse.redirect(accessDeniedUrl)
      }
      
      // Check if user has tenant_admin role
      // TODO: Add 'security_officer' and 'management' roles when available in Gateway
      if (user.role !== 'tenant_admin') {
        const accessDeniedUrl = new URL('/isms/access-denied', request.url)
        accessDeniedUrl.searchParams.set('reason', 'insufficient_role')
        accessDeniedUrl.searchParams.set('required', 'tenant_admin')
        accessDeniedUrl.searchParams.set('current', user.role)
        return NextResponse.redirect(accessDeniedUrl)
      }
    }
  }

  // Auth credentials exist and role check passed - allow request
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
}
