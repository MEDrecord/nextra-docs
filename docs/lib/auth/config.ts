/**
 * HealthTalk Gateway Authentication Configuration
 * 
 * All configuration is loaded from environment variables.
 * Never hardcode secrets or sensitive values.
 */

// Gateway URL - constant, never changes
export const GATEWAY_URL = 'https://auth-test-b2c.healthtalk.ai'

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
} as const
