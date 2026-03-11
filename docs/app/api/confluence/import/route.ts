import { NextRequest, NextResponse } from 'next/server'

const CONFLUENCE_BASE_URL = 'https://medrecord.atlassian.net/wiki'

interface ConfluencePage {
  id: string
  title: string
  body: {
    storage: {
      value: string
    }
  }
  version: {
    number: number
  }
  ancestors: Array<{ id: string; title: string }>
}

interface ConfluenceResponse {
  results: ConfluencePage[]
  size: number
  _links: {
    next?: string
  }
}

// Convert Confluence storage format (XHTML) to MDX-compatible Markdown
function convertToMdx(html: string, title: string): string {
  let content = html

  // Remove Confluence macros and convert to MDX-friendly format
  content = content
    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    
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
    .replace(/<ac:structured-macro[^>]*ac:name="code"[^>]*>.*?<ac:plain-text-body><!\[CDATA\[(.*?)\]\]><\/ac:plain-text-body>.*?<\/ac:structured-macro>/gis, '```\n$1\n```\n\n')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n\n')
    
    // Tables (basic conversion)
    .replace(/<table[^>]*>/gi, '\n')
    .replace(/<\/table>/gi, '\n')
    .replace(/<tr[^>]*>/gi, '| ')
    .replace(/<\/tr>/gi, ' |\n')
    .replace(/<th[^>]*>(.*?)<\/th>/gi, '$1 | ')
    .replace(/<td[^>]*>(.*?)<\/td>/gi, '$1 | ')
    .replace(/<thead[^>]*>/gi, '')
    .replace(/<\/thead>/gi, '|---|---|---|\n')
    .replace(/<tbody[^>]*>/gi, '')
    .replace(/<\/tbody>/gi, '')
    
    // Blockquotes / info panels
    .replace(/<ac:structured-macro[^>]*ac:name="(info|note|warning|tip)"[^>]*>.*?<ac:rich-text-body>(.*?)<\/ac:rich-text-body>.*?<\/ac:structured-macro>/gis, '> $2\n\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
    
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    
    // Clean up entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Add MDX frontmatter
  const mdx = `# ${title}

${content}
`

  return mdx
}

// Create safe filename from title
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  const apiToken = process.env.CONFLUENCE_API_TOKEN
  const spaceKey = request.nextUrl.searchParams.get('space') || 'ISMS'

  if (!email) {
    return NextResponse.json(
      { error: 'Missing email parameter - enter your Atlassian email in the form' },
      { status: 400 }
    )
  }

  if (!apiToken) {
    return NextResponse.json(
      { error: 'Missing CONFLUENCE_API_TOKEN environment variable - add it in v0 Vars' },
      { status: 500 }
    )
  }

  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64')
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  }

  try {
    const pages: Array<{
      id: string
      title: string
      slug: string
      path: string
      mdx: string
      ancestors: string[]
    }> = []

    let start = 0
    const limit = 200
    let hasMore = true

    while (hasMore) {
      const url = `${CONFLUENCE_BASE_URL}/rest/api/content?spaceKey=${spaceKey}&type=page&expand=body.storage,version,ancestors&limit=${limit}&start=${start}`
      
      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        throw new Error(`Confluence API error: ${response.status} ${response.statusText}`)
      }

      const data: ConfluenceResponse = await response.json()
      
      for (const page of data.results) {
        const slug = slugify(page.title)
        const ancestors = page.ancestors.map(a => slugify(a.title))
        const path = ancestors.length > 0 
          ? `${ancestors.join('/')}/${slug}`
          : slug

        pages.push({
          id: page.id,
          title: page.title,
          slug,
          path,
          mdx: convertToMdx(page.body.storage.value, page.title),
          ancestors: ancestors
        })
      }

      hasMore = data.size === limit
      start += limit
    }

    return NextResponse.json({
      success: true,
      space: spaceKey,
      pageCount: pages.length,
      pages: pages.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        path: p.path,
        mdxPreview: p.mdx.slice(0, 500) + '...',
        fullMdx: p.mdx
      }))
    })

  } catch (error) {
    console.error('Confluence import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
