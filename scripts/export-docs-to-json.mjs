/**
 * Export all MDX documentation to JSON format
 * 
 * Usage: node scripts/export-docs-to-json.mjs
 * Output: docs-export.json in the project root
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises'
import { join, relative, basename, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')
const DOCS_DIR = join(PROJECT_ROOT, 'docs', 'app')
const OUTPUT_FILE = join(PROJECT_ROOT, 'docs-export.json')

/**
 * Recursively find all MDX files in a directory
 */
async function findMdxFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    
    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await findMdxFiles(fullPath, files)
      }
    } else if (entry.name.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }
  
  return files
}

/**
 * Extract title from MDX content
 * Looks for # heading or title in frontmatter
 */
function extractTitle(content, filePath) {
  // Check for frontmatter title
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    const titleMatch = frontmatterMatch[1].match(/title:\s*['"]?([^'"\n]+)['"]?/)
    if (titleMatch) return titleMatch[1].trim()
  }
  
  // Check for first # heading
  const headingMatch = content.match(/^#\s+(.+)$/m)
  if (headingMatch) return headingMatch[1].trim()
  
  // Fallback to filename
  const fileName = basename(dirname(filePath))
  return fileName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Extract description from MDX content
 */
function extractDescription(content) {
  // Check for frontmatter description
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    const descMatch = frontmatterMatch[1].match(/description:\s*['"]?([^'"\n]+)['"]?/)
    if (descMatch) return descMatch[1].trim()
  }
  
  // Get first paragraph after title
  const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '')
  const withoutTitle = withoutFrontmatter.replace(/^#\s+.+\n+/, '')
  const firstParagraph = withoutTitle.match(/^[^#\n][^\n]+/)
  
  if (firstParagraph) {
    return firstParagraph[0].trim().slice(0, 200)
  }
  
  return null
}

/**
 * Convert file path to URL path
 */
function pathToUrl(filePath) {
  const relativePath = relative(DOCS_DIR, filePath)
  // Remove page.mdx from path
  let urlPath = relativePath.replace(/\/page\.mdx$/, '').replace(/\.mdx$/, '')
  // Handle index/root pages
  if (urlPath === 'page') urlPath = ''
  return '/' + urlPath
}

/**
 * Extract section from URL path
 */
function extractSection(urlPath) {
  const parts = urlPath.split('/').filter(Boolean)
  return parts[0] || 'root'
}

/**
 * Main export function
 */
async function exportDocs() {
  console.log('📚 Scanning for MDX files...')
  
  const mdxFiles = await findMdxFiles(DOCS_DIR)
  console.log(`   Found ${mdxFiles.length} MDX files`)
  
  const docs = []
  const sections = {}
  
  for (const filePath of mdxFiles) {
    const content = await readFile(filePath, 'utf-8')
    const stats = await stat(filePath)
    const urlPath = pathToUrl(filePath)
    const section = extractSection(urlPath)
    const title = extractTitle(content, filePath)
    const description = extractDescription(content)
    
    const doc = {
      id: urlPath.replace(/\//g, '-').replace(/^-/, '') || 'index',
      title,
      description,
      section,
      urlPath,
      filePath: relative(PROJECT_ROOT, filePath),
      content,
      contentLength: content.length,
      lastModified: stats.mtime.toISOString(),
    }
    
    docs.push(doc)
    
    // Group by section
    if (!sections[section]) {
      sections[section] = []
    }
    sections[section].push({
      title,
      urlPath,
      id: doc.id,
    })
  }
  
  // Sort docs by section and title
  docs.sort((a, b) => {
    if (a.section !== b.section) return a.section.localeCompare(b.section)
    return a.title.localeCompare(b.title)
  })
  
  const exportData = {
    exportDate: new Date().toISOString(),
    totalDocs: docs.length,
    sections: Object.keys(sections).sort(),
    sectionIndex: sections,
    documents: docs,
  }
  
  await writeFile(OUTPUT_FILE, JSON.stringify(exportData, null, 2), 'utf-8')
  
  console.log(`\n✅ Export complete!`)
  console.log(`   Output: ${relative(PROJECT_ROOT, OUTPUT_FILE)}`)
  console.log(`   Total documents: ${docs.length}`)
  console.log(`   Sections: ${Object.keys(sections).join(', ')}`)
  console.log(`\n📄 Section breakdown:`)
  for (const [section, items] of Object.entries(sections).sort()) {
    console.log(`   ${section}: ${items.length} docs`)
  }
}

// Run export
exportDocs().catch(err => {
  console.error('❌ Export failed:', err)
  process.exit(1)
})
