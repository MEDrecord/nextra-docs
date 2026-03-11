import 'server-only'

import { cookies } from 'next/headers'
import { GATEWAY_ENDPOINTS } from './config'
import type { Session, User, AuthResponse } from './types'

/**
 * Server-side authentication utilities
 * 
 * SECURITY: These functions run ONLY on the server.
 * They forward the auth.sid cookie to the gateway for session validation.
 */

/**
 * Forward cookies from the incoming request to the gateway
 * Required for session validation
 */
async function getForwardedCookies(): Promise<string> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('auth.sid')
  
  if (!authCookie) {
    return ''
  }
  
  return `auth.sid=${authCookie.value}`
}

/**
 * Make an authenticated fetch to the gateway
 * Automatically forwards cookies and handles errors
 */
export async function serverFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const forwardedCookies = await getForwardedCookies()
  
  if (!forwardedCookies) {
    return { data: null, error: 'No auth cookie present', status: 401 }
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': forwardedCookies,
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
  const { data, error, status } = await serverFetch<Session>(GATEWAY_ENDPOINTS.session)
  
  if (error || !data) {
    if (status !== 401) {
      console.error('[Auth Server] Failed to get session:', error)
    }
    return null
  }
  
  return data
}

/**
 * Get the current user from the gateway
 * Returns null if not authenticated
 */
export async function getUser(): Promise<User | null> {
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
 * Validate the current session
 * Returns true if authenticated, false otherwise
 */
export async function validateSession(): Promise<boolean> {
  const session = await getSession()
  
  if (!session) {
    return false
  }
  
  // Check if session has expired
  const expiresAt = new Date(session.expiresAt)
  if (expiresAt <= new Date()) {
    return false
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
 * Check if request has auth cookie (for middleware - doesn't validate session)
 * Use this only in middleware where async cookies() is not available
 */
export function hasAuthCookie(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || ''
  return cookieHeader.includes('auth.sid=')
}
