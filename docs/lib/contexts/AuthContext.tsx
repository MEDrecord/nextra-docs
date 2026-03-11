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
import { GATEWAY_ENDPOINTS, isCrossDomainModeClient } from '@/lib/auth/config'
import { 
  getStoredSessionId, 
  getStoredUser, 
  clearStoredAuth,
  verifySession,
  redirectToSignin,
} from '@/lib/auth/client'

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

  // Handle cross-domain auth redirect if not authenticated on protected pages
  useEffect(() => {
    if (!isLoading && !user && isCrossDomain) {
      // In cross-domain mode, if we're on a protected page without auth,
      // redirect to signin
      const isAuthPage = window.location.pathname.startsWith('/auth/')
      if (!isAuthPage) {
        redirectToSignin(window.location.pathname)
      }
    }
  }, [isLoading, user, isCrossDomain])

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
