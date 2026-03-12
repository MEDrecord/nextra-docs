import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * API Route: /api/content
 * 
 * Returns documentation page content as JSON for the helpdesk integration.
 * The gateway handles authentication - this endpoint trusts forwarded requests.
 * 
 * Query Parameters:
 * - path: The documentation path (e.g., /help/faq, help/faq)
 * 
 * Response Format:
 * {
 *   success: true,
 *   path: "/help/faq",
 *   title: "Frequently Asked Questions",
 *   content: "<article>...rendered HTML...</article>",
 *   lastModified: "2026-03-10T12:00:00.000Z"
 * }
 */

// Allowed origins for CORS (with credentials support)
const ALLOWED_ORIGINS = [
  'https://helpdesk.healthtalk.ai',
  'https://helpdesk-tst.healthtalk.ai',
  'http://localhost:3000',
  'http://localhost:3001',
]

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin)
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id',
    'Access-Control-Allow-Credentials': 'true',
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(request) })
}

// Enable edge caching
export const revalidate = 60

/**
 * Convert MDX content to simple HTML
 * This is a lightweight conversion that handles basic Markdown syntax
 */
function mdxToHtml(mdxContent: string): string {
  let html = mdxContent
  
  // Remove frontmatter if present
  html = html.replace(/^---[\s\S]*?---\n?/, '')
  
  // Remove MDX imports and exports
  html = html.replace(/^import\s+.*$/gm, '')
  html = html.replace(/^export\s+.*$/gm, '')
  
  // Remove JSX components (keep text content if simple)
  html = html.replace(/<[A-Z][a-zA-Z]*[^>]*\/>/g, '') // Self-closing components
  html = html.replace(/<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g, '') // Components with children
  
  // Convert headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
  
  // Convert bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')
  
  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // Convert code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
  
  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  
  // Convert images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
  
  // Convert horizontal rules
  html = html.replace(/^---+$/gm, '<hr />')
  html = html.replace(/^\*\*\*+$/gm, '<hr />')
  
  // Convert unordered lists
  html = html.replace(/^(\s*)[-*+]\s+(.+)$/gm, '$1<li>$2</li>')
  
  // Convert ordered lists
  html = html.replace(/^(\s*)\d+\.\s+(.+)$/gm, '$1<li>$2</li>')
  
  // Wrap consecutive <li> elements in <ul> (simplified)
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, '<ul>$&</ul>')
  
  // Convert blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
  
  // Convert paragraphs (lines not already wrapped)
  const lines = html.split('\n')
  const processedLines = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('<')) return line // Already HTML
    return `<p>${trimmed}</p>`
  })
  html = processedLines.join('\n')
  
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '')
  
  // Clean up extra whitespace
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
 * Normalize path - handle with/without leading slash
 */
function normalizePath(inputPath: string): string {
  let normalized = inputPath.trim()
  
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
 * Find the app directory across different environments
 */
async function findAppDir(): Promise<string | null> {
  const cwd = process.cwd()
  const possiblePaths = [
    path.join(cwd, 'app'),
    path.join(cwd, 'docs', 'app'),
    '/var/task/app',
    '/var/task/docs/app',
  ]
  
  for (const p of possiblePaths) {
    try {
      await fs.access(p)
      return p
    } catch {
      continue
    }
  }
  
  return null
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request)
  
  // Get path parameter
  const pathParam = request.nextUrl.searchParams.get('path')
  
  if (!pathParam) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing path parameter',
        path: null
      },
      { status: 400, headers: corsHeaders }
    )
  }
  
  const normalizedPath = normalizePath(pathParam)
  
  try {
    // Find app directory
    const appDir = await findAppDir()
    
    if (!appDir) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content directory not found',
          path: normalizedPath
        },
        { status: 500, headers: corsHeaders }
      )
    }
    
    // Construct file path
    // Path like /help/faq -> app/help/faq/page.mdx
    const mdxPath = path.join(appDir, normalizedPath, 'page.mdx')
    
    // Check if file exists
    try {
      await fs.access(mdxPath)
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Page not found',
          path: normalizedPath
        },
        { status: 404, headers: corsHeaders }
      )
    }
    
    // Read MDX content
    const mdxContent = await fs.readFile(mdxPath, 'utf-8')
    
    // Get file stats for lastModified
    const stats = await fs.stat(mdxPath)
    
    // Extract title and convert to HTML
    const title = extractTitle(mdxContent)
    const htmlContent = mdxToHtml(mdxContent)
    
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
