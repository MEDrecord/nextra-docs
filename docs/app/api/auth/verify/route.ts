import { NextResponse } from 'next/server'
import { getUser } from '../../../../lib/auth/server'

/**
 * API Route: Verify Authentication Status
 * 
 * GET /api/auth/verify
 * 
 * Returns the current user's authentication status.
 * Used by client components that need to check auth status
 * without making a direct call to the gateway.
 * 
 * Supports both authentication modes:
 * - Same-domain: Uses auth.sid cookie
 * - Cross-domain: Uses X-Session-Id header
 * 
 * SECURITY:
 * - Runs on server only
 * - Forwards credentials to gateway
 * - Does not expose any tokens or secrets
 */
export async function GET() {
  const user = await getUser()

  if (!user) {
    return NextResponse.json(
      { isAuthenticated: false, user: null },
      { status: 401 }
    )
  }

  return NextResponse.json({
    isAuthenticated: true,
    user,
  })
}
