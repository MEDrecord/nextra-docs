import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/server'

interface CallbackPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}

/**
 * Authentication Callback Page (Server Component)
 * 
 * This page is called by the HealthTalk Gateway after authentication.
 * It validates the session and redirects to the intended destination.
 * 
 * SECURITY:
 * - Validates that callbackUrl is internal (starts with /)
 * - Does not expose callback URL to client before validation
 * - Redirects to signin with error on session validation failure
 */
export default async function CallbackPage({ searchParams }: CallbackPageProps) {
  const params = await searchParams
  const callbackUrl = params.callbackUrl
  const error = params.error

  // If gateway returned an error, redirect to signin with error
  if (error) {
    redirect(`/auth/signin?error=${encodeURIComponent(error)}`)
  }

  // Validate session with the gateway
  const session = await getSession()

  if (!session) {
    // Session validation failed - redirect to signin with error
    redirect('/auth/signin?error=session_invalid')
  }

  // Validate callback URL is internal (prevent open redirect)
  let safeCallbackUrl = '/'
  
  if (callbackUrl) {
    // Must start with / but not // (which would be protocol-relative URL)
    if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
      // Additional validation: no suspicious patterns
      const decoded = decodeURIComponent(callbackUrl)
      if (!decoded.includes('://') && !decoded.includes('\\')) {
        safeCallbackUrl = callbackUrl
      }
    }
  }

  // Redirect to the intended destination
  redirect(safeCallbackUrl)
}
