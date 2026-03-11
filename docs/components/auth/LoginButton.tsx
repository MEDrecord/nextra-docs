'use client'

import { redirectToSignin, getCurrentPath } from '../../lib/auth/client'

interface LoginButtonProps {
  /** Path to redirect to after login (defaults to current path) */
  callbackUrl?: string
  /** Button label */
  children?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Login Button Component
 * 
 * Redirects the user to the HealthTalk Gateway for authentication.
 */
export function LoginButton({
  callbackUrl,
  children = 'Sign In',
  className = '',
}: LoginButtonProps) {
  const handleClick = () => {
    const targetUrl = callbackUrl || getCurrentPath()
    redirectToSignin(targetUrl)
  }

  return (
    <button
      onClick={handleClick}
      className={`rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors ${className}`}
    >
      {children}
    </button>
  )
}
