'use client'

import type { ReactNode } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { LoginButton } from './LoginButton'

interface ProtectedRouteProps {
  children: ReactNode
  /** Required role (optional - if not set, any authenticated user can access) */
  requiredRole?: string
  /** Custom loading component */
  loadingComponent?: ReactNode
  /** Custom unauthorized component */
  unauthorizedComponent?: ReactNode
}

/**
 * Protected Route Component
 * 
 * Wraps content that should only be visible to authenticated users.
 * Optionally requires a specific role.
 */
export function ProtectedRoute({
  children,
  requiredRole,
  loadingComponent,
  unauthorizedComponent,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return loadingComponent ?? (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return unauthorizedComponent ?? (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          You must be signed in to view this content.
        </p>
        <LoginButton />
      </div>
    )
  }

  if (requiredRole && user.role !== requiredRole) {
    return unauthorizedComponent ?? (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          You do not have permission to view this content.
        </p>
        <p className="text-sm text-muted-foreground">
          Required role: <span className="font-medium">{requiredRole}</span>
        </p>
      </div>
    )
  }

  return <>{children}</>
}
