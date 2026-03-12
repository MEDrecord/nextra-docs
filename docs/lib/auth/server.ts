import 'server-only'

import { cookies, headers } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { GATEWAY_ENDPOINTS, isCrossDomainMode } from './config'
import type { Session, User, AuthResponse } from './types'

// Cache duration for user data (30 seconds)
const USER_CACHE_TTL = 30

/**
 * Server-side authentication utilities
 * 
 * Supports TWO authentication modes:
 * 1. Cookie mode - Uses auth.sid HttpOnly cookie (same domain)
 * 2. SessionId mode - Uses X-Session-Id header (cross-domain)
 * 
 * SECURITY: These functions run ONLY on the server.
 */

/**
 * Get authentication credentials for gateway requests
 * Returns either Cookie header (same-domain) or X-Session-Id header (cross-domain)
 */
async function getAuthCredentials(): Promise<{ 
  headers: Record<string, string>
  hasCredentials: boolean 
}> {
  const isCrossDomain = isCrossDomainMode()
  
  if (isCrossDomain) {
    // Cross-domain mode: Look for X-Session-Id in incoming request headers
    const headerStore = await headers()
    const sessionId = headerStore.get('x-session-id')
    
    if (!sessionId) {
      return { headers: {}, hasCredentials: false }
    }
    
    return { 
      headers: { 'X-Session-Id': sessionId },
      hasCredentials: true 
    }
  } else {
    // Same-domain mode: Forward auth.sid cookie
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth.sid')
    
    if (!authCookie) {
      return { headers: {}, hasCredentials: false }
    }
    
    return { 
      headers: { 'Cookie': `auth.sid=${authCookie.value}` },
      hasCredentials: true 
    }
  }
}

/**
 * Make an authenticated fetch to the gateway
 * Automatically uses correct auth method based on domain
 */
export async function serverFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { headers: authHeaders, hasCredentials } = await getAuthCredentials()
  
  if (!hasCredentials) {
    return { data: null, error: 'No auth credentials present', status: 401 }
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      // Disable caching for auth requests
      cache: 'no-store',
    })
    
    if (!response.ok) {
      const errorBody = await response.text()
      return { 
        data: null, 
        error: errorBody || `Gateway error: ${response.status}`,
        status: response.status 
      }
    }
    
    const data = await response.json() as T
    return { data, error: null, status: response.status }
  } catch (error) {
    console.error('[Auth Server] Gateway fetch error:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Network error',
      status: 500 
    }
  }
}

/**
 * Get the current session from the gateway
 * Returns null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  const isCrossDomain = isCrossDomainMode()
  
  // For cross-domain, use the web-session/verify endpoint
  const endpoint = isCrossDomain 
    ? GATEWAY_ENDPOINTS.webSessionVerify 
    : GATEWAY_ENDPOINTS.session
    
  const { data, error, status } = await serverFetch<Session>(endpoint)
  
  if (error || !data) {
    if (status !== 401) {
      console.error('[Auth Server] Failed to get session:', error)
    }
    return null
  }
  
  return data
}

/**
 * Internal function to fetch user (uncached)
 */
async function fetchUserFromGateway(authKey: string): Promise<User | null> {
  // authKey is used for cache key differentiation, not for auth
  const { data, error, status } = await serverFetch<User>(GATEWAY_ENDPOINTS.userMe)
  
  if (error || !data) {
    if (status !== 401) {
      console.error('[Auth Server] Failed to get user:', error)
    }
    return null
  }
  
  return data
}

/**
 * Get the current user from the gateway (cached for performance)
 * Returns null if not authenticated
 * 
 * Uses unstable_cache to cache the user data for 30 seconds per session
 */
export async function getUser(): Promise<User | null> {
  const { hasCredentials } = await getAuthCredentials()
  
  if (!hasCredentials) {
    return null
  }
  
  // Get a cache key based on the session
  const isCrossDomain = isCrossDomainMode()
  let cacheKey: string
  
  if (isCrossDomain) {
    const headerStore = await headers()
    cacheKey = headerStore.get('x-session-id') || 'no-session'
  } else {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth.sid')
    cacheKey = authCookie?.value?.substring(0, 16) || 'no-session'
  }
  
  // Use unstable_cache to cache the result per session
  const cachedFetch = unstable_cache(
    () => fetchUserFromGateway(cacheKey),
    [`user-${cacheKey}`],
    { revalidate: USER_CACHE_TTL, tags: ['user'] }
  )
  
  return cachedFetch()
}

/**
 * Validate the current session
 * Returns true if authenticated, false otherwise
 */
export async function validateSession(): Promise<boolean> {
  const session = await getSession()
  
  if (!session) {
    return false
  }
  
  // Check if session has expired
  if (session.expiresAt) {
    const expiresAt = new Date(session.expiresAt)
    if (expiresAt <= new Date()) {
      return false
    }
  }
  
  return true
}

/**
 * Get authentication response with user data
 * Useful for components that need both auth status and user info
 */
export async function getAuthResponse(): Promise<AuthResponse> {
  const user = await getUser()
  
  return {
    user,
    isAuthenticated: !!user,
  }
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const user = await getUser()
  
  if (!user) {
    return false
  }
  
  return user.role === requiredRole
}

/**
 * Check if request has auth credentials (for middleware)
 * Works with both cookie mode and cross-domain session ID mode
 */
export function hasAuthCredentials(request: Request): boolean {
  const isCrossDomain = isCrossDomainMode()
  
  if (isCrossDomain) {
    // Check for X-Session-Id header OR sessionId in localStorage (client must send it)
    const sessionIdHeader = request.headers.get('x-session-id')
    return !!sessionIdHeader
  } else {
    // Check for auth.sid cookie
    const cookieHeader = request.headers.get('cookie') || ''
    return cookieHeader.includes('auth.sid=')
  }
}

/**
 * Extract session ID from request (for cross-domain mode)
 */
export function getSessionIdFromRequest(request: Request): string | null {
  return request.headers.get('x-session-id')
}
