'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '@/lib/auth/types'
import { GATEWAY_ENDPOINTS } from '@/lib/auth/config'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  refetchSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  /** Optional initial user from server-side rendering */
  initialUser?: User | null
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [isLoading, setIsLoading] = useState(!initialUser) // Skip loading if we have initial user
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(GATEWAY_ENDPOINTS.userMe, {
        credentials: 'include',
        cache: 'no-store',
      })

      if (response.status === 401) {
        // Not authenticated - this is expected when user is not logged in
        setUser(null)
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`)
      }

      const userData = await response.json() as User
      setUser(userData)
    } catch (err) {
      console.error('[AuthContext] Failed to fetch session:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch session')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch session on mount (only if no initial user)
  useEffect(() => {
    if (!initialUser) {
      fetchSession()
    }
  }, [fetchSession, initialUser])

  const refetchSession = useCallback(async () => {
    await fetchSession()
  }, [fetchSession])

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetchSession,
  }

  return <AuthContext value={value}>{children}</AuthContext>
}

/**
 * Hook to access authentication state
 * Must be used within an AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

/**
 * Hook that requires authentication
 * Throws an error if used outside AuthProvider
 * Returns user as non-null when authenticated
 */
export function useRequireAuth(): AuthContextValue & { user: User } {
  const auth = useAuth()
  
  if (!auth.isAuthenticated || !auth.user) {
    throw new Error('User must be authenticated to use this component')
  }
  
  return auth as AuthContextValue & { user: User }
}
