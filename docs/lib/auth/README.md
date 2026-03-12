# HealthTalk Gateway Authentication

This document describes the complete authentication implementation for the HealthTalk Docs site, integrating with the HealthTalk API Gateway for secure, zero-knowledge authentication.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Modes](#authentication-modes)
4. [File Structure](#file-structure)
5. [Configuration](#configuration)
6. [Security Model](#security-model)
7. [Role-Based Access Control](#role-based-access-control)
8. [Usage Guide](#usage-guide)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The authentication system implements a **dual-mode architecture** that automatically adapts based on the deployment environment:

| Mode | Domain Example | Auth Method | Storage |
|------|----------------|-------------|---------|
| **Cookie Mode** | `docs.healthtalk.ai` | HttpOnly `auth.sid` cookie | Server-side (Gateway) |
| **WebToken Mode** | `*.vercel.app`, `localhost` | `X-Session-Id` header | `localStorage` |

### Key Principles

- **Zero-Knowledge**: The app never sees OAuth credentials (Client ID/Secret)
- **No Token Exposure**: Access/refresh tokens stay server-side in the Gateway's Redis
- **Automatic Mode Detection**: Based on domain comparison with Gateway
- **Secure by Default**: Cross-domain mode for unknown domains

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         ┌─────────────────────────┐    ┌──────────────┐  │
│   │  Docs App    │         │  HealthTalk Gateway     │    │  Azure B2C   │  │
│   │  (Next.js)   │         │  auth-test-b2c.         │    │              │  │
│   │              │         │  healthtalk.ai          │    │              │  │
│   └──────┬───────┘         └───────────┬─────────────┘    └──────┬───────┘  │
│          │                             │                         │          │
│          │  1. Redirect to signin      │                         │          │
│          │ ─────────────────────────►  │                         │          │
│          │    ?tenantId=X&callbackUrl= │                         │          │
│          │                             │                         │          │
│          │                             │  2. Redirect to B2C     │          │
│          │                             │ ───────────────────────►│          │
│          │                             │                         │          │
│          │                             │  3. User authenticates  │          │
│          │                             │ ◄───────────────────────│          │
│          │                             │    (auth code)          │          │
│          │                             │                         │          │
│          │                             │  4. Exchange code for   │          │
│          │                             │     tokens (server-side)│          │
│          │                             │                         │          │
│   SAME DOMAIN:                         │                         │          │
│          │  5a. Set auth.sid cookie    │                         │          │
│          │ ◄─────────────────────────  │                         │          │
│          │                             │                         │          │
│   CROSS DOMAIN:                        │                         │          │
│          │  5b. Redirect with webToken │                         │          │
│          │ ◄─────────────────────────  │                         │          │
│          │                             │                         │          │
│          │  6. Exchange webToken       │                         │          │
│          │ ─────────────────────────►  │                         │          │
│          │     (POST with origin)      │                         │          │
│          │                             │                         │          │
│          │  7. Receive sessionId       │                         │          │
│          │ ◄─────────────────────────  │                         │          │
│          │     (store in localStorage) │                         │          │
│          │                             │                         │          │
└──────────┴─────────────────────────────┴─────────────────────────┴──────────┘
```

---

## Authentication Modes

### Cookie Mode (Same Domain)

Used when the app is deployed on `*.healthtalk.ai` (same parent domain as Gateway).

**How it works:**
1. User clicks "Sign In" → redirected to Gateway
2. After B2C authentication, Gateway sets `auth.sid` HttpOnly cookie
3. Cookie automatically sent with all requests to Gateway
4. Server components can validate session via cookie forwarding

**Advantages:**
- Automatic cookie handling by browser
- More secure (HttpOnly, Secure, SameSite=Lax)
- Works with server-side rendering

### WebToken Mode (Cross Domain)

Used for preview deployments (`*.vercel.app`) or local development.

**How it works:**
1. User clicks "Sign In" → redirected to Gateway
2. After B2C auth, Gateway redirects back with `?webToken=wst_xxx`
3. App exchanges webToken for sessionId (POST with origin validation)
4. sessionId stored in localStorage
5. All API requests include `X-Session-Id` header

**Security measures:**
- webToken is single-use, expires in 60 seconds
- Origin validation prevents unauthorized exchanges
- sessionId is opaque (no embedded claims)

---

## File Structure

```
docs/lib/auth/
├── README.md           # This documentation
├── index.ts            # Public exports (barrel file)
├── config.ts           # Configuration and URL utilities
├── types.ts            # TypeScript interfaces and role constants
├── server.ts           # Server-side auth functions (use 'server-only')
└── client.ts           # Client-side auth functions

docs/lib/contexts/
└── AuthContext.tsx     # React context provider for auth state

docs/components/auth/
├── index.ts            # Component exports
├── LoginButton.tsx     # Sign-in button component
├── UserMenu.tsx        # User dropdown with logout
└── ProtectedRoute.tsx  # Client-side route protection

docs/app/auth/
├── signin/page.tsx     # Redirect to Gateway signin
├── callback/page.tsx   # Handle OAuth callback (webToken exchange)
└── signout/page.tsx    # Logout page

docs/app/api/auth/
└── verify/route.ts     # Session verification endpoint

docs/
└── middleware.ts       # Route protection middleware
```

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_TENANT_ID` | No | Tenant identifier for Gateway (default: `"default"`) |
| `NEXT_PUBLIC_APP_URL` | No | App base URL (auto-detected from `VERCEL_URL` or `window.location`) |

### Auto-Detection

The app automatically detects:

1. **App URL** (in order of priority):
   - `NEXT_PUBLIC_APP_URL` environment variable
   - `VERCEL_URL` (auto-set by Vercel for previews)
   - `window.location.origin` (client-side)
   - `http://localhost:3000` (fallback)

2. **Authentication Mode**:
   - Compares app hostname with Gateway domain (`healthtalk.ai`)
   - Same parent domain → Cookie mode
   - Different domain → WebToken mode

### Constants

```typescript
// Gateway configuration (do not change)
GATEWAY_URL = 'https://auth-test-b2c.healthtalk.ai'
GATEWAY_DOMAIN = 'healthtalk.ai'

// Storage keys for cross-domain mode
SESSION_STORAGE_KEY = 'auth.sessionId'
USER_STORAGE_KEY = 'auth.user'
```

---

## Security Model

### What's Protected

| Layer | Protection | Details |
|-------|------------|---------|
| **Middleware** | Route-level | Redirects unauthenticated users to signin |
| **Server Components** | Session validation | `getUser()` verifies with Gateway |
| **API Routes** | Auth + Role check | 401 Unauthorized, 403 Forbidden |
| **Client Components** | Auth context | Loading states, redirect on 401 |

### Security Features

1. **No Client-Side Tokens**
   - B2C access/refresh/id tokens never leave the Gateway
   - Only opaque sessionId exposed to cross-domain apps

2. **Callback URL Validation**
   - Must start with `/` (internal paths only)
   - Prevents open redirect attacks

3. **Origin Validation**
   - webToken exchange validates Origin header
   - Gateway checks against tenant's CORS configuration

4. **Single-Use WebToken**
   - `wst_` prefixed tokens expire in 60 seconds
   - Atomic consumption prevents replay attacks

5. **HttpOnly Cookies** (same-domain)
   - Cannot be accessed by JavaScript
   - Secure flag requires HTTPS
   - SameSite=Lax prevents CSRF

6. **Session Expiry**
   - Sessions valid for 24 hours
   - Gateway auto-refreshes B2C tokens
   - 401 response triggers re-authentication

---

## Role-Based Access Control

### Available Roles

```typescript
const ROLES = {
  USER: 'user',           // Standard authenticated user
  TENANT_ADMIN: 'tenant_admin'  // Elevated admin access
}
```

### Permission Matrix

| Resource | `user` | `tenant_admin` |
|----------|--------|----------------|
| View documentation | Yes | Yes |
| Access admin pages | No | Yes |
| Confluence import API | No | Yes |

### Implementation

**Client-side (React component):**
```tsx
import { useAuth } from '../lib/contexts/AuthContext'
import { ROLES } from '../lib/auth/types'

function AdminPage() {
  const { user, isLoading } = useAuth()
  
  if (isLoading) return <Loading />
  if (user?.role !== ROLES.TENANT_ADMIN) return <AccessDenied />
  
  return <AdminContent />
}
```

**Server-side (API route):**
```typescript
import { getUser } from '../lib/auth/server'
import { ROLES } from '../lib/auth/types'

export async function GET(request: NextRequest) {
  const user = await getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (user.role !== ROLES.TENANT_ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Proceed with admin operation
}
```

---

## Usage Guide

### Protecting Pages

**Option 1: Middleware (recommended for route patterns)**

The middleware automatically protects all routes except:
- `/auth/*` (signin, callback, signout)
- `/api/*` (handled separately)
- `/_next/*`, `/favicon.ico` (static assets)

**Option 2: Client-side with ProtectedRoute**

```tsx
import { ProtectedRoute } from '../components/auth'

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="tenant_admin">
      <DashboardContent />
    </ProtectedRoute>
  )
}
```

**Option 3: useAuth hook**

```tsx
import { useAuth } from '../lib/contexts/AuthContext'

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  
  if (isLoading) return <Spinner />
  if (!isAuthenticated) return <LoginPrompt />
  
  return <div>Welcome, {user.name}!</div>
}
```

### Making Authenticated API Calls

**From Client Components:**

```typescript
import { fetchWithAuth } from '../lib/auth/client'

// Automatically handles both cookie and sessionId modes
const response = await fetchWithAuth('/api/protected-endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

**From Server Components/API Routes:**

```typescript
import { serverFetch, getUser } from '../lib/auth/server'

// Verify authentication
const user = await getUser()
if (!user) throw new Error('Not authenticated')

// Make authenticated request to Gateway
const data = await serverFetch('/api/some-gateway-endpoint')
```

### Triggering Sign In

```tsx
import { LoginButton } from '../components/auth'

// Simple button
<LoginButton />

// With custom callback
<LoginButton callbackUrl="/dashboard" />

// Programmatic redirect
import { redirectToSignin } from '../lib/auth/client'
redirectToSignin('/after-login-path')
```

### Handling Sign Out

```tsx
import { UserMenu } from '../components/auth'

// Full user menu with logout
<UserMenu />

// Programmatic logout
import { logout } from '../lib/auth/client'
await logout() // Clears session, redirects to home
```

---

## API Reference

### Gateway Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/signin` | GET | No | Initiate OAuth flow |
| `/api/auth/signout` | GET | Yes | Destroy session |
| `/api/auth/session` | GET | Yes | Get session info |
| `/api/user/me` | GET | Yes | Get user details |
| `/api/auth/web-session/exchange` | POST | No | Exchange webToken |
| `/api/auth/web-session/verify` | GET | Header | Verify sessionId |

### Internal Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/verify` | GET | Proxy session verification |

### Exported Functions

**From `lib/auth/server.ts` (Server-only):**

```typescript
getSession(): Promise<Session | null>
getUser(): Promise<User | null>
validateSession(): Promise<boolean>
serverFetch(url: string, options?: RequestInit): Promise<Response>
```

**From `lib/auth/client.ts` (Client-only):**

```typescript
redirectToSignin(callbackPath?: string): void
logout(): Promise<void>
fetchWithAuth(url: string, options?: RequestInit): Promise<Response>
exchangeWebToken(webToken: string): Promise<TokenExchangeResult | null>
verifySession(): Promise<boolean>
getStoredSessionId(): string | null
getStoredUser(): User | null
clearStoredAuth(): void
```

**From `lib/auth/config.ts`:**

```typescript
getAppUrl(): string
getAppUrlClient(): string
getSigninUrl(callbackPath?: string): string
getSigninUrlClient(callbackPath?: string): string
getSignoutUrl(): string
isCrossDomainMode(): boolean
isCrossDomainModeClient(): boolean
isCrossDomainModeFromHost(hostname: string): boolean
```

---

## Troubleshooting

### "Origin not allowed" (403)

**Cause:** App's origin not in tenant's CORS configuration.

**Solution:** Contact Gateway admin to add your origin:
```
Please add: https://your-app.vercel.app
Pattern: https://*.vercel.app (for preview URLs)
```

### "webToken already used" (400)

**Cause:** Token was already exchanged (single-use enforcement).

**Solution:** Ensure exchange happens only once per token. Check for:
- Duplicate useEffect calls
- Request retries
- Multiple component mounts

### "Session expired" (401)

**Cause:** sessionId older than 24 hours or invalidated.

**Solution:** Clear local storage and redirect to signin:
```typescript
clearStoredAuth()
redirectToSignin()
```

### Redirect loop on signin

**Cause:** Middleware and auth check competing.

**Solution:** Ensure `/auth/*` paths are excluded from middleware protection.

### "useAuth must be used within AuthProvider"

**Cause:** Component rendered outside AuthProvider during SSG.

**Solution:** The hook now returns safe defaults during SSG. If still occurring, ensure layout wraps children with `<AuthProvider>`.

### Build fails with Suspense boundary error

**Cause:** `useSearchParams()` requires Suspense in Next.js 13+.

**Solution:** Wrap the component using `useSearchParams` in `<Suspense>`:
```tsx
<Suspense fallback={<Loading />}>
  <ComponentUsingSearchParams />
</Suspense>
```

---

## Helpdesk Integration Guide

The Helpdesk application (`helpdesk.healthtalk.ai`) can integrate with this docs site to display documentation content and leverage the shared authentication.

### Authentication Flow for Helpdesk

Since both apps are on the same domain (`*.healthtalk.ai`), they share the same `auth.sid` cookie set by the Gateway. This means:

1. **User authenticates on Helpdesk** → Cookie set for `*.healthtalk.ai`
2. **Helpdesk fetches from Docs API** → Cookie automatically included
3. **No additional auth needed** - Single Sign-On via shared cookie

### Content API

The docs site exposes a `/api/content` endpoint for retrieving documentation as JSON.

**Endpoint:** `https://docs.healthtalk.ai/api/content` (or `docs-tst.healthtalk.ai` for test)

**Request:**
```http
GET /api/content?path=/help/faq
Origin: https://helpdesk.healthtalk.ai
```

**Response:**
```json
{
  "success": true,
  "path": "/help/faq",
  "title": "Frequently Asked Questions",
  "content": "<article class=\"prose\">...HTML content...</article>",
  "lastModified": "2026-03-10T12:00:00.000Z"
}
```

### CORS Configuration

The `/api/content` endpoint allows requests from:
- All `*.healthtalk.ai` subdomains (HTTPS only)
- `localhost` with any port (development)

Requests from other origins will be blocked.

### Integration Code Example

**Helpdesk Frontend (TypeScript):**

```typescript
// lib/docs-api.ts
const DOCS_API_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'https://docs.healthtalk.ai'

export interface DocsContent {
  success: boolean
  path: string
  title: string
  content: string
  lastModified: string
  error?: string
}

/**
 * Fetch documentation content from the Docs site.
 * Uses credentials: 'include' to send the shared auth.sid cookie.
 */
export async function fetchDocsContent(path: string): Promise<DocsContent> {
  const response = await fetch(
    `${DOCS_API_URL}/api/content?path=${encodeURIComponent(path)}`,
    {
      credentials: 'include', // Important: sends auth.sid cookie
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `Failed to fetch: ${response.status}`)
  }
  
  return response.json()
}

// Usage in a React component
export function HelpArticle({ articlePath }: { articlePath: string }) {
  const [content, setContent] = useState<DocsContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchDocsContent(articlePath)
      .then(setContent)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [articlePath])
  
  if (loading) return <Spinner />
  if (error) return <ErrorMessage message={error} />
  if (!content?.success) return <NotFound />
  
  return (
    <article>
      <h1>{content.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content.content }} />
      <footer>Last updated: {new Date(content.lastModified).toLocaleDateString()}</footer>
    </article>
  )
}
```

**Server-side (if Helpdesk has a backend):**

```typescript
// pages/api/help/[...path].ts (Next.js API route)
import { NextApiRequest, NextApiResponse } from 'next'

const DOCS_API_URL = process.env.DOCS_API_URL || 'https://docs.healthtalk.ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const path = (req.query.path as string[]).join('/')
  
  // Forward the auth cookie from the incoming request
  const response = await fetch(
    `${DOCS_API_URL}/api/content?path=/${path}`,
    {
      headers: {
        'Cookie': req.headers.cookie || '',
      },
    }
  )
  
  const data = await response.json()
  res.status(response.status).json(data)
}
```

### Authentication States

When integrating, handle these states:

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| Success | 200 | `{ success: true, title, content, ... }` |
| Page not found | 404 | `{ success: false, error: "Page not found" }` |
| Missing path param | 400 | `{ success: false, error: "Missing path parameter" }` |
| Server error | 500 | `{ success: false, error: "..." }` |

### Triggering Sign In from Helpdesk

If you need to redirect users to sign in from Helpdesk:

```typescript
// Redirect to Gateway signin with callback back to Helpdesk
const GATEWAY_URL = 'https://auth-test-b2c.healthtalk.ai'
const TENANT_ID = 'your-tenant-id'

function redirectToSignin(callbackPath: string = '/') {
  const callbackUrl = encodeURIComponent(
    `${window.location.origin}${callbackPath}`
  )
  window.location.href = `${GATEWAY_URL}/api/auth/signin?tenantId=${TENANT_ID}&callbackUrl=${callbackUrl}`
}
```

### Verifying User Session

To check if a user is authenticated before making requests:

```typescript
// Check session via Docs verify endpoint
async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch(
      `${DOCS_API_URL}/api/auth/verify`,
      { credentials: 'include' }
    )
    const data = await response.json()
    return data.authenticated === true
  } catch {
    return false
  }
}
```

Or directly with the Gateway:

```typescript
// Check session directly with Gateway
async function getUser(): Promise<User | null> {
  try {
    const response = await fetch(
      'https://auth-test-b2c.healthtalk.ai/api/user/me',
      { credentials: 'include' }
    )
    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}
```

### Environment Variables for Helpdesk

```env
# Docs API URL
NEXT_PUBLIC_DOCS_URL=https://docs.healthtalk.ai      # Production
NEXT_PUBLIC_DOCS_URL=https://docs-tst.healthtalk.ai  # Test

# Gateway URL (for direct auth operations)
NEXT_PUBLIC_GATEWAY_URL=https://auth-test-b2c.healthtalk.ai

# Tenant ID (get from Gateway admin)
NEXT_PUBLIC_TENANT_ID=helpdesk
```

---

## Changelog

### v1.0.0
- Initial implementation with dual-mode authentication
- Cookie mode for same-domain deployments
- WebToken/sessionId mode for cross-domain (v0 previews)
- Role-based access control (user, tenant_admin)
- Middleware protection for all routes
- AuthContext with SSR/SSG safe defaults
- Smart URL detection for preview environments
- `/api/content` endpoint for helpdesk integration
