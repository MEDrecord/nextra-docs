'use client'

/**
 * Client-side authentication utilities
 * 
 * Supports TWO authentication modes:
 * 1. Cookie mode - Uses HttpOnly cookies (same-domain)
 * 2. SessionId mode - Uses localStorage + X-Session-Id header (cross-domain)
 * 
 * SECURITY: 
 * - No B2C tokens stored client-side
 * - In cross-domain mode, only opaque sessionId is stored (no embedded claims)
 */

import { 
  getSigninUrlClient, 
  getSignoutUrl, 
  GATEWAY_ENDPOINTS,
  SESSION_STORAGE_KEY, 
  USER_STORAGE_KEY,
  isCrossDomainModeClient,
} from './config'
import type { User } from './types'

/**
 * Get stored session ID (cross-domain mode only)
 */
export function getStoredSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SESSION_STORAGE_KEY)
}

/**
 * Store session ID (cross-domain mode only)
 */
export function storeSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
}

/**
 * Get stored user data (cross-domain mode only)
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const userJson = localStorage.getItem(USER_STORAGE_KEY)
  if (!userJson) return null
  try {
    return JSON.parse(userJson) as User
  } catch {
    return null
  }
}

/**
 * Store user data (cross-domain mode only)
 */
export function storeUser(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

/**
 * Clear all stored auth data
 */
export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

/**
 * Check if user has stored credentials (cross-domain mode)
 */
export function hasStoredCredentials(): boolean {
  return !!getStoredSessionId()
}

/**
 * Redirect to the HealthTalk Gateway signin page
 * @param callbackPath - Path to redirect to after authentication (must start with /)
 */
export function redirectToSignin(callbackPath: string = '/'): void {
  // Validate callback path is internal (security: prevent open redirects)
  if (!callbackPath.startsWith('/')) {
    console.error('[Auth Client] Invalid callback path - must start with /')
    callbackPath = '/'
  }
  
  // Use client-side URL detection for accurate preview URL handling
  const signinUrl = getSigninUrlClient(callbackPath)
  window.location.href = signinUrl
}

/**
 * Logout the user
 * - Cross-domain: Clear localStorage and redirect to gateway signout
 * - Same-domain: Just redirect to gateway signout (clears cookie)
 */
export async function logout(): Promise<void> {
  const isCrossDomain = isCrossDomainModeClient()
  
  // Always clear local storage in cross-domain mode
  if (isCrossDomain) {
    clearStoredAuth()
  }
  
  try {
    // Call the gateway signout endpoint to destroy the session
    const response = await fetch(getSignoutUrl(), {
      method: 'GET',
      credentials: 'include',
    })
    
    if (!response.ok) {
      console.error('[Auth Client] Signout request failed:', response.status)
    }
  } catch (error) {
    console.error('[Auth Client] Signout error:', error)
  }
  
  // Always redirect to home
  window.location.href = '/'
}

/**
 * Exchange webToken for sessionId (cross-domain mode only)
 * Called after OAuth callback when gateway returns webToken in URL
 */
export async function exchangeWebToken(webToken: string): Promise<{
  sessionId: string
  user: User
  expiresAt: string
} | null> {
  try {
    const response = await fetch(GATEWAY_ENDPOINTS.webSessionExchange, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
      },
      body: JSON.stringify({ webToken }),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Auth Client] WebToken exchange failed:', errorData)
      return null
    }
    
    const data = await response.json()
    
    // Store credentials locally
    storeSessionId(data.sessionId)
    storeUser(data.user)
    
    return data
  } catch (error) {
    console.error('[Auth Client] WebToken exchange error:', error)
    return null
  }
}

/**
 * Verify sessionId is still valid (cross-domain mode)
 */
export async function verifySession(): Promise<boolean> {
  const sessionId = getStoredSessionId()
  
  if (!sessionId) {
    return false
  }
  
  try {
    const response = await fetch(GATEWAY_ENDPOINTS.webSessionVerify, {
      method: 'GET',
      headers: {
        'X-Session-Id': sessionId,
      },
    })
    
    if (!response.ok) {
      // Session invalid - clear stored data
      clearStoredAuth()
      return false
    }
    
    const data = await response.json()
    return data.valid === true
  } catch {
    return false
  }
}

/**
 * Fetch wrapper that includes credentials and handles 401 responses
 * Automatically uses correct auth method based on domain
 */
export async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const isCrossDomain = isCrossDomainModeClient()
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }
    
    // In cross-domain mode, add X-Session-Id header
    if (isCrossDomain) {
      const sessionId = getStoredSessionId()
      if (sessionId) {
        headers['X-Session-Id'] = sessionId
      }
    }
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    })
    
    if (response.status === 401) {
      // Session expired or invalid
      if (isCrossDomain) {
        clearStoredAuth()
      }
      
      // Redirect to signin
      const currentPath = window.location.pathname
      redirectToSignin(currentPath)
      return { data: null, error: 'Session expired' }
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      return { data: null, error: errorText || `Error: ${response.status}` }
    }
    
    const data = await response.json() as T
    return { data, error: null }
  } catch (error) {
    console.error('[Auth Client] Fetch error:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Network error' 
    }
  }
}

/**
 * Get the current path for use in callback URLs
 */
export function getCurrentPath(): string {
  if (typeof window === 'undefined') {
    return '/'
  }
  return window.location.pathname + window.location.search
}
