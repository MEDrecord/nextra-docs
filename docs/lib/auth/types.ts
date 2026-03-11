/**
 * HealthTalk Gateway Authentication Types
 */

export interface User {
  id: string
  email: string
  name: string
  role: string
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
