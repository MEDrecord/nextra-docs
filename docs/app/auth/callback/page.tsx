'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { exchangeWebToken } from '../../../lib/auth/client'
import { isCrossDomainModeClient } from '../../../lib/auth/config'

/**
 * Authentication Callback Handler
 * 
 * Handles OAuth callback from HealthTalk Gateway.
 * 
 * TWO MODES:
 * 1. Same-domain (cookie mode): Gateway sets HttpOnly cookie, just validate and redirect
 * 2. Cross-domain (webToken mode): Exchange webToken for sessionId, store locally, redirect
 * 
 * SECURITY:
 * - Validates that callbackUrl is internal (starts with /)
 * - WebToken is single-use and expires in 60 seconds
 * - SessionId is opaque (no embedded claims)
 */
function CallbackHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    async function handleCallback() {
      const webToken = searchParams.get('webToken')
      const callbackUrl = searchParams.get('callbackUrl')
      const errorParam = searchParams.get('error')

      // If gateway returned an error, show it
      if (errorParam) {
        setError(errorParam)
        setIsProcessing(false)
        return
      }

      // Validate callback URL is internal (prevent open redirect)
      let safeCallbackUrl = '/'
      if (callbackUrl) {
        // Must start with / but not // (protocol-relative URL)
        if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
          // Additional validation: no suspicious patterns
          const decoded = decodeURIComponent(callbackUrl)
          if (!decoded.includes('://') && !decoded.includes('\\')) {
            safeCallbackUrl = callbackUrl
          }
        }
      }

      const isCrossDomain = isCrossDomainModeClient()

      if (isCrossDomain) {
        // Cross-domain mode: Exchange webToken for sessionId
        if (!webToken) {
          setError('No webToken received from gateway. Authentication failed.')
          setIsProcessing(false)
          return
        }

        const result = await exchangeWebToken(webToken)
        
        if (!result) {
          setError('Failed to exchange authentication token. Please try again.')
          setIsProcessing(false)
          return
        }

        // Successfully authenticated - redirect to callback URL
        router.replace(safeCallbackUrl)
      } else {
        // Same-domain mode: Cookie should already be set by gateway
        // Just redirect to callback URL - server will validate session
        router.replace(safeCallbackUrl)
      }
    }

    handleCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a 
            href="/auth/signin" 
            className="text-blue-600 hover:underline"
          >
            Try signing in again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
        <p className="text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  )
}

/**
 * Callback Page - Wrapped in Suspense for useSearchParams
 * 
 * Next.js requires useSearchParams to be wrapped in a Suspense boundary
 * to enable static generation with dynamic params.
 */
export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  )
}
