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
    throw new Error('NEXT_PUBLIC_TENANT_ID environment variable is not set')
  }
  return tenantId
}

// App URL - the base URL of this application
export function getAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set')
  }
  // Remove trailing slash if present
  return appUrl.replace(/\/$/, '')
}

/**
 * Detect if we're in cross-domain mode
 * Cross-domain mode is used when the app is NOT on the same parent domain as the gateway
 * 
 * Examples:
 * - app on docs.healthtalk.ai, gateway on auth-test-b2c.healthtalk.ai -> SAME domain (cookie mode)
 * - app on my-app.vercel.app, gateway on auth-test-b2c.healthtalk.ai -> CROSS domain (webToken mode)
 */
export function isCrossDomainMode(): boolean {
  try {
    const appUrl = getAppUrl()
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
 * Generate the signin URL for the HealthTalk Gateway
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
