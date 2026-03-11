/**
 * HealthTalk Gateway Authentication Configuration
 * 
 * Supports TWO authentication modes:
 * 1. Cookie mode - For same-domain deployments (production on *.healthtalk.ai)
 * 2. WebToken/SessionId mode - For cross-domain deployments (v0 preview, *.vercel.app)
 * 
 * The mode is auto-detected based on the app's domain vs gateway domain.
 */

// Gateway URL - constant, never changes
export const GATEWAY_URL = 'https://auth-test-b2c.healthtalk.ai'
export const GATEWAY_DOMAIN = 'healthtalk.ai'

// Session storage key for cross-domain mode
export const SESSION_STORAGE_KEY = 'auth.sessionId'
export const USER_STORAGE_KEY = 'auth.user'

// Tenant ID - identifies this app to the gateway
export function getTenantId(): string {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID
  if (!tenantId) {
    // Default tenant for development/preview
    return 'default'
  }
  return tenantId
}

/**
 * App URL - the base URL of this application
 * Smart detection order:
 * 1. NEXT_PUBLIC_APP_URL env var (explicit configuration)
 * 2. VERCEL_URL env var (auto-set by Vercel for preview deployments)
 * 3. window.location.origin (client-side auto-detection)
 * 4. localhost fallback for development
 */
export function getAppUrl(): string {
  // 1. Check explicit configuration
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  
  // 2. Check Vercel preview URL (automatically set by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // 3. Client-side: use window.location
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // 4. Fallback for local development
  return 'http://localhost:3000'
}

/**
 * Get app URL on client side (always uses window.location)
 * Use this in client components for accurate URL detection
 */
export function getAppUrlClient(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return getAppUrl()
}

/**
 * Detect if we're in cross-domain mode using NEXT_PUBLIC_APP_URL
 * Cross-domain mode is used when the app is NOT on the same parent domain as the gateway
 * 
 * Examples:
 * - app on docs.healthtalk.ai, gateway on auth-test-b2c.healthtalk.ai -> SAME domain (cookie mode)
 * - app on my-app.vercel.app, gateway on auth-test-b2c.healthtalk.ai -> CROSS domain (webToken mode)
 */
export function isCrossDomainMode(): boolean {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      // If env var not set, assume cross-domain for safety
      return true
    }
    const appHostname = new URL(appUrl).hostname
    
    // Check if app is on the same parent domain as gateway
    // Gateway is on *.healthtalk.ai
    return !appHostname.endsWith(GATEWAY_DOMAIN)
  } catch {
    // If we can't determine, assume cross-domain for safety
    return true
  }
}

/**
 * Detect cross-domain mode from request hostname (for middleware)
 */
export function isCrossDomainModeFromHost(hostname: string): boolean {
  return !hostname.endsWith(GATEWAY_DOMAIN)
}

/**
 * Check cross-domain mode on client side using window.location
 */
export function isCrossDomainModeClient(): boolean {
  if (typeof window === 'undefined') {
    return true // Assume cross-domain on server for safety
  }
  
  const hostname = window.location.hostname
  return !hostname.endsWith(GATEWAY_DOMAIN)
}

/**
 * Generate the signin URL for the HealthTalk Gateway (server-side)
 * @param callbackPath - The path to redirect to after successful authentication (must start with /)
 */
export function getSigninUrl(callbackPath: string = '/'): string {
  // Validate callback path is internal (security: prevent open redirects)
  if (!callbackPath.startsWith('/')) {
    throw new Error('Callback path must start with /')
  }
  
  const tenantId = getTenantId()
  const appUrl = getAppUrl()
  const callbackUrl = encodeURIComponent(`${appUrl}/auth/callback?callbackUrl=${encodeURIComponent(callbackPath)}`)
  
  return `${GATEWAY_URL}/api/auth/signin?tenantId=${encodeURIComponent(tenantId)}&callbackUrl=${callbackUrl}`
}

/**
 * Generate the signin URL for the HealthTalk Gateway (client-side)
 * Uses window.location.origin for accurate URL detection in preview environments
 * @param callbackPath - The path to redirect to after successful authentication (must start with /)
 */
export function getSigninUrlClient(callbackPath: string = '/'): string {
  // Validate callback path is internal (security: prevent open redirects)
  if (!callbackPath.startsWith('/')) {
    throw new Error('Callback path must start with /')
  }
  
  const tenantId = getTenantId()
  const appUrl = getAppUrlClient()
  const callbackUrl = encodeURIComponent(`${appUrl}/auth/callback?callbackUrl=${encodeURIComponent(callbackPath)}`)
  
  return `${GATEWAY_URL}/api/auth/signin?tenantId=${encodeURIComponent(tenantId)}&callbackUrl=${callbackUrl}`
}

/**
 * Generate the signout URL for the HealthTalk Gateway
 */
export function getSignoutUrl(): string {
  return `${GATEWAY_URL}/api/auth/signout`
}

/**
 * Gateway API endpoints
 */
export const GATEWAY_ENDPOINTS = {
  signin: `${GATEWAY_URL}/api/auth/signin`,
  signout: `${GATEWAY_URL}/api/auth/signout`,
  session: `${GATEWAY_URL}/api/auth/session`,
  userMe: `${GATEWAY_URL}/api/user/me`,
  userTenants: `${GATEWAY_URL}/api/user/tenants`,
  switchTenant: `${GATEWAY_URL}/api/user/switch-tenant`,
  // Cross-domain webToken endpoints
  webSessionExchange: `${GATEWAY_URL}/api/auth/web-session/exchange`,
  webSessionVerify: `${GATEWAY_URL}/api/auth/web-session/verify`,
} as const
