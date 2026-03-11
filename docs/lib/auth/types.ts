/**
 * HealthTalk Gateway Authentication Types
 */

/**
 * Role constants for role-based access control
 * - user: Standard authenticated user (can view docs)
 * - tenant_admin: Elevated admin role (can access admin endpoints like Confluence import)
 */
export const ROLES = {
  USER: 'user',
  TENANT_ADMIN: 'tenant_admin',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

export interface User {
  id: string
  email: string
  name: string
  role: UserRole | string
  tenantId: string
  tenantName: string
}

export interface Session {
  user: User
  expiresAt: string
}

export interface AuthResponse {
  user: User | null
  isAuthenticated: boolean
  error?: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
}

export interface GatewayError {
  error: string
  message?: string
  statusCode?: number
}
