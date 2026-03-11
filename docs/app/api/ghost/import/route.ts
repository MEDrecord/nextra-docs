import { NextRequest, NextResponse } from 'next/server'

interface GhostPost {
  id: string
  title: string
  slug: string
  html: string
  excerpt: string
  feature_image: string | null
  published_at: string
  updated_at: string
  tags: Array<{ id: string; name: string; slug: string }>
  primary_tag: { id: string; name: string; slug: string } | null
}

interface GhostResponse {
  posts: GhostPost[]
  meta: {
    pagination: {
      page: number
      limit: number
      pages: number
      total: number
      next: number | null
      prev: number | null
    }
  }
}

// Convert Ghost HTML to MDX-compatible Markdown
function convertToMdx(html: string, title: string, excerpt: string, tags: string[]): string {
  let content = html

  content = content
    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    
    // Paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    
    // Bold and italic
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    
    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    
    // Lists
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    
    // Code blocks
    .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    
    // Images
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)\n\n')
    .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)\n\n')
    
    // Blockquotes
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_, content) => {
      return content.split('\n').map((line: string) => `> ${line}`).join('\n') + '\n\n'
    })
    
    // Figures and figcaptions
    .replace(/<figure[^>]*>(.*?)<\/figure>/gis, '$1\n\n')
    .replace(/<figcaption[^>]*>(.*?)<\/figcaption>/gi, '*$1*\n\n')
    
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    
    // Horizontal rules
    .replace(/<hr\s*\/?>/gi, '\n---\n\n')
    
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    
    // Clean up entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Add MDX with frontmatter-style metadata as comments
  const tagsList = tags.length > 0 ? `\n\n**Tags:** ${tags.join(', ')}` : ''
  
  const mdx = `# ${title}

${excerpt ? `> ${excerpt}\n\n` : ''}${content}${tagsList}
`

  return mdx
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.GHOST_API_KEY
  const apiUrl = process.env.GHOST_API_URL || 'https://your-ghost-blog.ghost.io'
  const tag = request.nextUrl.searchParams.get('tag') || ''
  const limit = request.nextUrl.searchParams.get('limit') || '100'

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing GHOST_API_KEY environment variable - add it in v0 Vars' },
      { status: 500 }
    )
  }

  try {
    const posts: Array<{
      id: string
      title: string
      slug: string
      excerpt: string
      tags: string[]
      publishedAt: string
      mdx: string
    }> = []

    let page = 1
    let hasMore = true

    while (hasMore) {
      const params = new URLSearchParams({
        key: apiKey,
        limit: limit,
        page: String(page),
        include: 'tags',
        fields: 'id,title,slug,html,excerpt,feature_image,published_at,updated_at'
      })

      if (tag) {
        params.append('filter', `tag:${tag}`)
      }

      const url = `${apiUrl}/ghost/api/content/posts/?${params.toString()}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ghost API error: ${response.status} - ${errorText}`)
      }

      const data: GhostResponse = await response.json()
      
      for (const post of data.posts) {
        const tagNames = post.tags?.map(t => t.name) || []
        
        posts.push({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || '',
          tags: tagNames,
          publishedAt: post.published_at,
          mdx: convertToMdx(post.html, post.title, post.excerpt || '', tagNames)
        })
      }

      hasMore = data.meta.pagination.next !== null
      page++
      
      // Safety limit
      if (page > 50) break
    }

    return NextResponse.json({
      success: true,
      source: apiUrl,
      postCount: posts.length,
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        tags: p.tags,
        publishedAt: p.publishedAt,
        mdxPreview: p.mdx.slice(0, 500) + '...',
        fullMdx: p.mdx
      }))
    })

  } catch (error) {
    console.error('Ghost import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
