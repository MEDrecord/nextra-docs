'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '../auth/types'
import { GATEWAY_ENDPOINTS, isCrossDomainModeClient } from '../auth/config'
import { 
  getStoredSessionId, 
  getStoredUser, 
  clearStoredAuth,
  verifySession,
} from '../auth/client'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  isCrossDomain: boolean
  refetchSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  /** Optional initial user from server-side rendering (same-domain mode only) */
  initialUser?: User | null
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [isLoading, setIsLoading] = useState(!initialUser)
  const [error, setError] = useState<string | null>(null)
  const [isCrossDomain, setIsCrossDomain] = useState(false)

  const fetchSession = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const crossDomain = isCrossDomainModeClient()
    setIsCrossDomain(crossDomain)

    if (crossDomain) {
      // Cross-domain mode: Check localStorage first
      const storedUser = getStoredUser()
      const sessionId = getStoredSessionId()

      if (!sessionId) {
        // No stored session - user needs to login
        setUser(null)
        setIsLoading(false)
        return
      }

      // Verify session is still valid
      const isValid = await verifySession()
      
      if (!isValid) {
        clearStoredAuth()
        setUser(null)
        setIsLoading(false)
        return
      }

      // Session valid - use stored user or fetch fresh
      if (storedUser) {
        setUser(storedUser)
        setIsLoading(false)
      } else {
        // Fetch user from gateway
        try {
          const response = await fetch(GATEWAY_ENDPOINTS.userMe, {
            credentials: 'include',
            headers: {
              'X-Session-Id': sessionId,
            },
            cache: 'no-store',
          })

          if (response.ok) {
            const userData = await response.json() as User
            setUser(userData)
          } else {
            clearStoredAuth()
            setUser(null)
          }
        } catch {
          setUser(null)
        }
        setIsLoading(false)
      }
    } else {
      // Same-domain mode: Fetch from gateway using cookie
      try {
        const response = await fetch(GATEWAY_ENDPOINTS.userMe, {
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.status === 401) {
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
    }
  }, [])

  // Fetch session on mount
  useEffect(() => {
    // In cross-domain mode, always check localStorage
    // In same-domain mode, only fetch if no initial user
    const crossDomain = isCrossDomainModeClient()
    
    if (crossDomain || !initialUser) {
      fetchSession()
    }
  }, [fetchSession, initialUser])

  // Note: Auto-redirect is NOT done here - middleware handles route protection
  // This allows the AuthContext to be used on public pages without forcing login

  const refetchSession = useCallback(async () => {
    await fetchSession()
  }, [fetchSession])

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    isCrossDomain,
    refetchSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Default auth value returned during SSG/SSR when AuthProvider is not available
 * This prevents build errors while ensuring the app works correctly at runtime
 */
const DEFAULT_AUTH_VALUE: AuthContextValue = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  isCrossDomain: false,
  refetchSession: async () => {},
}

/**
 * Hook to access authentication state
 * Returns a safe default during SSG when AuthProvider is not yet mounted
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  
  // Return safe default during SSG/SSR or when context not yet available
  // This allows the build to complete - at runtime, AuthProvider will be mounted
  if (context === undefined) {
    return DEFAULT_AUTH_VALUE
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
