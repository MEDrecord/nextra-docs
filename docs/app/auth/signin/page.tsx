'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { redirectToSignin } from '@/lib/auth/client'

/**
 * Sign In Page
 * 
 * Redirects to the HealthTalk Gateway for authentication.
 * Shows a loading state while redirecting.
 */
export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  useEffect(() => {
    // Don't redirect if there's an error to show
    if (error) {
      return
    }

    // Validate callback URL is internal (prevent open redirect)
    let safeCallbackUrl = '/'
    if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
      safeCallbackUrl = callbackUrl
    }

    // Small delay to show the loading state
    const timer = setTimeout(() => {
      redirectToSignin(safeCallbackUrl)
    }, 100)

    return () => clearTimeout(timer)
  }, [callbackUrl, error])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Authentication Error
            </h1>
            <p className="mt-4 text-muted-foreground">
              {error === 'session_invalid' 
                ? 'Your session is invalid or has expired. Please sign in again.'
                : error === 'access_denied'
                ? 'Access was denied. You may not have permission to access this resource.'
                : `An error occurred: ${error}`}
            </p>
            <button
              onClick={() => redirectToSignin('/')}
              className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <h1 className="text-xl font-medium text-foreground">
          Redirecting to sign in...
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You will be redirected to the HealthTalk authentication portal.
        </p>
      </div>
    </div>
  )
}
