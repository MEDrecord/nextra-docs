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

// Enable edge caching
export const revalidate = 300 // Cache for 5 minutes

interface KnowledgeItem {
  id: string
  title: string
  path: string
  type: 'isms' | 'help' | 'knowledge' | 'developer'
  content: string
  tags: string[]
  lastModified?: string
}

// Recursively read MDX files from a directory
async function readMdxFiles(dir: string, basePath: string, type: KnowledgeItem['type']): Promise<KnowledgeItem[]> {
  const items: KnowledgeItem[] = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        const subItems = await readMdxFiles(fullPath, `${basePath}/${entry.name}`, type)
        items.push(...subItems)
      } else if (entry.name === 'page.mdx') {
        try {
          const content = await fs.readFile(fullPath, 'utf-8')
          const stats = await fs.stat(fullPath)
          
          // Extract title from first heading
          const titleMatch = content.match(/^#\s+(.+)$/m)
          const title: string = titleMatch?.[1] ?? path.basename(path.dirname(fullPath))
          
          // Extract tags from content (look for **Tags:** pattern)
          const tagsMatch = content.match(/\*\*Tags:\*\*\s*(.+)$/m)
          const tags = tagsMatch?.[1] 
            ? tagsMatch[1].split(',').map(t => t.trim())
            : []
          
          items.push({
            id: `${type}-${basePath.replace(/\//g, '-')}`,
            title,
            path: basePath,
            type,
            content: content.replace(/^#\s+.+$/m, '').trim(), // Remove title from content
            tags,
            lastModified: stats.mtime.toISOString()
          })
        } catch {
          // Skip files that can't be read
        }
      }
    }
  } catch {
    // Directory doesn't exist
  }
  
  return items
}

export async function GET(request: NextRequest) {
  const typeFilter = request.nextUrl.searchParams.get('type') // 'all', 'isms', 'help', 'knowledge', 'developer'
  const format = request.nextUrl.searchParams.get('format') || 'json' // 'json' or 'training'
  
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
      console.error('[Knowledge Export] No valid app directory found. CWD:', cwd)
      return NextResponse.json({
        success: true,
        format: format,
        itemCount: 0,
        items: [],
        debug: { cwd, checked: possiblePaths }
      }, { headers: corsHeaders })
    }
    
    const allItems: KnowledgeItem[] = []
    
    // Read from each section
    const sections: Array<{ dir: string; type: KnowledgeItem['type'] }> = [
      { dir: path.join(appDir, 'isms'), type: 'isms' },
      { dir: path.join(appDir, 'help'), type: 'help' },
      { dir: path.join(appDir, 'knowledge'), type: 'knowledge' },
      { dir: path.join(appDir, 'developer'), type: 'developer' }
    ]
    
    for (const section of sections) {
      if (typeFilter && typeFilter !== 'all' && typeFilter !== section.type) {
        continue
      }
      
      const items = await readMdxFiles(section.dir, `/${section.type}`, section.type)
      allItems.push(...items)
    }
    
    // Format for training (simplified structure for AI agents)
    if (format === 'training') {
      const trainingData = allItems.map(item => ({
        question: `What is ${item.title}?`,
        context: item.content.slice(0, 2000), // Limit content length
        source: item.path,
        type: item.type,
        tags: item.tags
      }))
      
      return NextResponse.json({
        success: true,
        format: 'training',
        itemCount: trainingData.length,
        data: trainingData
      }, { headers: corsHeaders })
    }
    
    // Standard JSON export
    return NextResponse.json({
      success: true,
      format: 'json',
      itemCount: allItems.length,
      items: allItems.map(item => ({
        id: item.id,
        title: item.title,
        path: item.path,
        type: item.type,
        tags: item.tags,
        contentPreview: item.content.slice(0, 300) + '...',
        fullContent: item.content,
        lastModified: item.lastModified
      }))
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Knowledge export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
