/**
 * HealthTalk Gateway Authentication
 * 
 * This module provides authentication utilities for the HealthTalk docs site.
 * Authentication is handled by the HealthTalk API Gateway using HttpOnly cookies.
 * 
 * Usage:
 * - Server Components: import { getUser, getSession } from '@/lib/auth/server'
 * - Client Components: import { redirectToSignin, logout } from '@/lib/auth/client'
 * - Types: import type { User, Session } from '@/lib/auth/types'
 */

// Re-export types
export type { User, Session, AuthResponse, Tenant, GatewayError } from './types'

// Re-export config
export { 
  GATEWAY_URL, 
  getTenantId, 
  getAppUrl, 
  getSigninUrl, 
  getSignoutUrl,
  GATEWAY_ENDPOINTS 
} from './config'

// Note: server.ts and client.ts should be imported directly
// to ensure proper code splitting and tree-shaking
