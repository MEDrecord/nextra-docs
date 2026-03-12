import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Force dynamic rendering - this route accesses the file system
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * API Route: /api/content
 * 
 * Returns documentation page content as JSON for the helpdesk integration.
 * 
 * Query Parameters:
 * - path: The documentation path (e.g., /help/faq, /isms/policies/password)
 * 
 * Valid paths match the URL structure of the docs site:
 * - /isms -> app/isms/page.mdx
 * - /help/faq -> app/help/faq/page.mdx
 * - /docs/getting-started/introduction -> app/docs/getting-started/introduction/page.mdx
 */

/**
 * CORS Configuration - allows *.healthtalk.ai and localhost
 */
const HEALTHTALK_DOMAIN_PATTERN = /^https:\/\/([a-z0-9-]+\.)*healthtalk\.ai$/
const LOCALHOST_PATTERN = /^http:\/\/localhost(:\d+)?$/

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false
  return HEALTHTALK_DOMAIN_PATTERN.test(origin) || LOCALHOST_PATTERN.test(origin)
}

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || ''
  const isAllowed = isAllowedOrigin(origin)
  const allowOrigin = isAllowed ? origin : ''
  
  return {
    ...(allowOrigin && { 'Access-Control-Allow-Origin': allowOrigin }),
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    'Vary': 'Origin',
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(request) })
}

/**
 * Convert MDX content to simple HTML
 */
function mdxToHtml(mdxContent: string): string {
  let html = mdxContent
  
  // Remove frontmatter
  html = html.replace(/^---[\s\S]*?---\n?/, '')
  
  // Remove MDX imports and exports
  html = html.replace(/^import\s+.*$/gm, '')
  html = html.replace(/^export\s+.*$/gm, '')
  
  // Remove JSX components
  html = html.replace(/<[A-Z][a-zA-Z]*[^>]*\/>/g, '')
  html = html.replace(/<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g, '')
  
  // Convert headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
  
  // Convert formatting
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
  html = html.replace(/^---+$/gm, '<hr />')
  html = html.replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>')
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, '<ul>$&</ul>')
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
  
  // Convert remaining lines to paragraphs
  const lines = html.split('\n')
  const processedLines = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('<')) return line
    return `<p>${trimmed}</p>`
  })
  html = processedLines.join('\n')
  
  html = html.replace(/<p>\s*<\/p>/g, '')
  html = html.replace(/\n{3,}/g, '\n\n')
  
  return html.trim()
}

/**
 * Extract title from MDX content
 */
function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m)
  return titleMatch?.[1] ?? 'Untitled'
}

/**
 * Normalize and validate the path
 */
function normalizePath(inputPath: string): string {
  let normalized = inputPath.trim()
  
  // Remove .mdx extension if provided
  normalized = normalized.replace(/\/page\.mdx$/, '')
  normalized = normalized.replace(/\.mdx$/, '')
  
  // Add leading slash if missing
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized
  }
  
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '')
  
  // Security: prevent path traversal
  normalized = normalized.replace(/\.\./g, '')
  
  return normalized
}

/**
 * Get the app directory - works on Vercel and locally
 */
function getAppDir(): string {
  // On Vercel, the docs folder is deployed as the root
  // cwd is /var/task which contains the app folder
  return path.join(process.cwd(), 'app')
}

/**
 * Try multiple file paths to find the MDX file
 */
async function findMdxFile(normalizedPath: string): Promise<{ filePath: string; content: string } | null> {
  const appDir = getAppDir()
  
  // Paths to try (in order of priority)
  const pathsToTry = [
    // Direct path: /isms -> app/isms/page.mdx
    path.join(appDir, normalizedPath, 'page.mdx'),
    // Index page: /isms -> app/isms/index.mdx (fallback)
    path.join(appDir, normalizedPath, 'index.mdx'),
    // Direct MDX file: /isms -> app/isms.mdx (unlikely but check)
    path.join(appDir, `${normalizedPath}.mdx`),
  ]
  
  for (const filePath of pathsToTry) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return { filePath, content }
    } catch {
      // File doesn't exist, try next
      continue
    }
  }
  
  return null
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request)
  
  const pathParam = request.nextUrl.searchParams.get('path')
  
  if (!pathParam) {
    return NextResponse.json(
      { success: false, error: 'Missing path parameter', path: null },
      { status: 400, headers: corsHeaders }
    )
  }
  
  const normalizedPath = normalizePath(pathParam)
  
  try {
    const result = await findMdxFile(normalizedPath)
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Page not found', path: normalizedPath },
        { status: 404, headers: corsHeaders }
      )
    }
    
    const { filePath, content } = result
    const stats = await fs.stat(filePath)
    const title = extractTitle(content)
    const htmlContent = mdxToHtml(content)
    
    return NextResponse.json(
      {
        success: true,
        path: normalizedPath,
        title,
        content: `<article class="prose">${htmlContent}</article>`,
        lastModified: stats.mtime.toISOString()
      },
      { headers: corsHeaders }
    )
    
  } catch (error) {
    console.error('[Content API] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        path: normalizedPath
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
