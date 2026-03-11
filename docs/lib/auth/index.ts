/**
 * HealthTalk Gateway Authentication
 * 
 * This module provides authentication utilities for the HealthTalk docs site.
 * 
 * Supports TWO authentication modes:
 * 1. Cookie mode (same-domain): Uses HttpOnly auth.sid cookie
 * 2. SessionId mode (cross-domain): Uses X-Session-Id header + localStorage
 * 
 * The mode is auto-detected based on whether the app domain matches the gateway domain.
 * 
 * Usage:
 * - Server Components: import { getUser, getSession } from '@/lib/auth/server'
 * - Client Components: import { redirectToSignin, logout, exchangeWebToken } from '@/lib/auth/client'
 * - Types: import type { User, Session } from '@/lib/auth/types'
 */

// Re-export types
export type { User, Session, AuthResponse, Tenant, GatewayError } from './types'

// Re-export config
export { 
  GATEWAY_URL, 
  GATEWAY_DOMAIN,
  SESSION_STORAGE_KEY,
  USER_STORAGE_KEY,
  getTenantId, 
  getAppUrl, 
  getSigninUrl, 
  getSignoutUrl,
  isCrossDomainMode,
  isCrossDomainModeClient,
  GATEWAY_ENDPOINTS 
} from './config'

// Note: server.ts and client.ts should be imported directly
// to ensure proper code splitting and tree-shaking
