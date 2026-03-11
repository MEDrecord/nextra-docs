'use client'

/**
 * Client-side authentication utilities
 * 
 * SECURITY: No tokens or secrets are stored client-side.
 * Authentication relies on HttpOnly cookies managed by the gateway.
 */

import { getSigninUrl, getSignoutUrl } from './config'

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
  
  const signinUrl = getSigninUrl(callbackPath)
  window.location.href = signinUrl
}

/**
 * Logout the user by calling the gateway signout endpoint
 * Then redirect to the home page
 */
export async function logout(): Promise<void> {
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
  
  // Always redirect to home, even if signout failed
  // The cookie should be cleared by the gateway
  window.location.href = '/'
}

/**
 * Fetch wrapper that includes credentials and handles 401 responses
 * Automatically redirects to signin on authentication failure
 */
export async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    if (response.status === 401) {
      // Session expired or invalid - redirect to signin
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
