import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// CORS headers for cross-origin requests from helpdesk app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// Enable edge caching - lightweight endpoint
export const revalidate = 300

interface KnowledgeListItem {
  id: string
  title: string
  path: string
  type: 'isms' | 'help' | 'knowledge' | 'developer'
}

// Recursively list MDX files (metadata only, no content)
async function listMdxFiles(dir: string, basePath: string, type: KnowledgeListItem['type']): Promise<KnowledgeListItem[]> {
  const items: KnowledgeListItem[] = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        const subItems = await listMdxFiles(fullPath, `${basePath}/${entry.name}`, type)
        items.push(...subItems)
      } else if (entry.name === 'page.mdx') {
        // Only read first 500 bytes to extract title - much faster
        const fd = await fs.open(fullPath, 'r')
        const buffer = Buffer.alloc(500)
        await fd.read(buffer, 0, 500, 0)
        await fd.close()
        
        const content = buffer.toString('utf-8')
        const titleMatch = content.match(/^#\s+(.+)$/m)
        const title = titleMatch?.[1] ?? path.basename(path.dirname(fullPath))
        
        items.push({
          id: `${type}-${basePath.replace(/\//g, '-')}`,
          title,
          path: basePath,
          type
        })
      }
    }
  } catch {
    // Directory doesn't exist
  }
  
  return items
}

export async function GET(request: NextRequest) {
  const typeFilter = request.nextUrl.searchParams.get('type')
  
  try {
    // Find the app directory - check multiple possible locations
    const cwd = process.cwd()
    const possiblePaths = [
      path.join(cwd, 'app'),
      path.join(cwd, 'docs', 'app'),
      '/var/task/app',
      '/var/task/docs/app',
    ]
    
    let appDir: string | null = null
    for (const p of possiblePaths) {
      try {
        await fs.access(p)
        // Verify it has isms folder
        await fs.access(path.join(p, 'isms'))
        appDir = p
        break
      } catch {
        continue
      }
    }
    
    if (!appDir) {
      console.error('[Knowledge List] No valid app directory found. CWD:', cwd)
      return NextResponse.json({
        success: true,
        itemCount: 0,
        items: [],
        debug: { cwd, checked: possiblePaths }
      }, { headers: corsHeaders })
    }
    
    const allItems: KnowledgeListItem[] = []
    
    const sections: Array<{ dir: string; type: KnowledgeListItem['type'] }> = [
      { dir: path.join(appDir, 'isms'), type: 'isms' },
      { dir: path.join(appDir, 'help'), type: 'help' },
      { dir: path.join(appDir, 'knowledge'), type: 'knowledge' },
      { dir: path.join(appDir, 'developer'), type: 'developer' }
    ]
    
    for (const section of sections) {
      if (typeFilter && typeFilter !== 'all' && typeFilter !== section.type) {
        continue
      }
      
      const items = await listMdxFiles(section.dir, `/${section.type}`, section.type)
      allItems.push(...items)
    }
    
    return NextResponse.json({
      success: true,
      itemCount: allItems.length,
      items: allItems
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Knowledge list error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
