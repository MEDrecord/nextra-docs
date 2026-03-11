'use client'

import { useEffect, useState } from 'react'
import { logout } from '../../../lib/auth/client'

/**
 * Sign Out Page
 * 
 * Provides a logout button and auto-logout countdown.
 * Calls the gateway signout endpoint to destroy the session.
 */
export default function SignOutPage() {
  const [countdown, setCountdown] = useState(5)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    if (countdown <= 0) {
      handleLogout()
      return
    }

    const timer = setTimeout(() => {
      setCountdown(c => c - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    await logout()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Sign Out
          </h1>
          <p className="mt-4 text-muted-foreground">
            {isLoggingOut
              ? 'Signing you out...'
              : `You will be signed out in ${countdown} second${countdown !== 1 ? 's' : ''}.`}
          </p>

          {isLoggingOut ? (
            <div className="mt-6 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          ) : (
            <div className="mt-6 flex gap-4 justify-center">
              <button
                onClick={handleLogout}
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign Out Now
              </button>
              <button
                onClick={() => window.history.back()}
                className="rounded-md border border-border px-4 py-2 text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
