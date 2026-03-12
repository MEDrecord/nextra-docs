import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { marked } from 'marked'

// Force dynamic rendering - this route accesses the file system
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Configure marked for GFM (GitHub Flavored Markdown)
marked.setOptions({
  gfm: true,
  breaks: true,
})

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
 * Convert MDX content to HTML using marked
 */
function mdxToHtml(mdxContent: string): string {
  let content = mdxContent
  
  // Remove frontmatter
  content = content.replace(/^---[\s\S]*?---\n?/, '')
  
  // Remove MDX imports and exports
  content = content.replace(/^import\s+.*$/gm, '')
  content = content.replace(/^export\s+.*$/gm, '')
  
  // Remove JSX components (self-closing and with children)
  content = content.replace(/<[A-Z][a-zA-Z]*[^>]*\/>/g, '')
  content = content.replace(/<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g, '')
  
  // Remove JSX expressions
  content = content.replace(/\{[^}]*\}/g, '')
  
  // Parse markdown to HTML using marked
  const html = marked.parse(content, { async: false }) as string
  
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
      continue
    }
  }
  
  return null
}

/**
 * Recursively list all MDX files in a directory
 */
async function listMdxFiles(dir: string, basePath: string = ''): Promise<Array<{ path: string; title: string }>> {
  const items: Array<{ path: string; title: string }> = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        // Skip api, auth, admin directories
        if (['api', 'auth', 'admin', '_meta'].includes(entry.name)) continue
        
        // Check for page.mdx in this directory
        const pageMdxPath = path.join(fullPath, 'page.mdx')
        try {
          const content = await fs.readFile(pageMdxPath, 'utf-8')
          const title = extractTitle(content)
          const urlPath = path.join(basePath, entry.name)
          items.push({ path: '/' + urlPath, title })
        } catch {
          // No page.mdx, continue
        }
        
        // Recurse into subdirectory
        const subItems = await listMdxFiles(fullPath, path.join(basePath, entry.name))
        items.push(...subItems)
      }
    }
  } catch (e) {
    console.error('[Content API] Error listing directory:', dir, e)
  }
  
  return items
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request)
  
  const action = request.nextUrl.searchParams.get('action')
  const pathParam = request.nextUrl.searchParams.get('path')
  const section = request.nextUrl.searchParams.get('section')
  
  // Handle list action
  if (action === 'list') {
    try {
      const appDir = getAppDir()
      const searchDir = section ? path.join(appDir, section) : appDir
      const basePath = section || ''
      
      const items = await listMdxFiles(searchDir, basePath)
      
      return NextResponse.json(
        { success: true, items, section: section || 'all' },
        { headers: corsHeaders }
      )
    } catch (error) {
      console.error('[Content API] List error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to list content', items: [] },
        { status: 500, headers: corsHeaders }
      )
    }
  }
  
  // Handle single page fetch
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
        content: `<article class="prose prose-sm max-w-none">${htmlContent}</article>`,
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
