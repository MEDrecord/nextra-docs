'use client'

import { useState } from 'react'

interface PageData {
  id: string
  title: string
  slug: string
  path: string
  mdxPreview: string
  fullMdx: string
}

interface ImportResult {
  success: boolean
  space: string
  pageCount: number
  pages: PageData[]
  error?: string
}

export default function ConfluenceImportPage() {
  const [spaceKey, setSpaceKey] = useState('ISMS')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null)

  const handleImport = async () => {
    if (!email) {
      setError('Please enter your Atlassian email')
      return
    }
    
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('[v0] Starting import for space:', spaceKey, 'email:', email)
      const url = `/api/confluence/import?space=${spaceKey}&email=${encodeURIComponent(email)}`
      console.log('[v0] Fetching:', url)
      
      const response = await fetch(url)
      console.log('[v0] Response status:', response.status)
      
      const text = await response.text()
      console.log('[v0] Response text:', text.substring(0, 500))
      
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`)
      }

      if (!response.ok) {
        throw new Error(data.error || `Import failed with status ${response.status}`)
      }

      console.log('[v0] Import successful, pages:', data.pageCount)
      setResult(data)
    } catch (err) {
      console.error('[v0] Import error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const downloadMdx = (page: PageData) => {
    const blob = new Blob([page.fullMdx], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${page.slug}.mdx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadAll = () => {
    if (!result) return
    
    try {
      console.log('[v0] Starting download of', result.pages.length, 'pages')
      
      const allContent = result.pages.map(p => ({
        path: `docs/app/docs/isms/${p.path}/page.mdx`,
        content: p.fullMdx
      }))
      
      // Create JSON string in chunks to avoid memory issues
      const jsonString = JSON.stringify(allContent, null, 2)
      console.log('[v0] JSON size:', (jsonString.length / 1024 / 1024).toFixed(2), 'MB')
      
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `confluence-export-${spaceKey}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // Clean up after a delay to ensure download starts
      setTimeout(() => {
        URL.revokeObjectURL(url)
        console.log('[v0] Download cleanup complete')
      }, 1000)
    } catch (err) {
      console.error('[v0] Download error:', err)
      setError(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Confluence ISMS Import</h1>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Make sure you have set <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">CONFLUENCE_API_TOKEN</code> in v0 Vars (from id.atlassian.com/manage-profile/security/api-tokens)
        </p>
        
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Your Atlassian Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 w-64"
              placeholder="your.email@medvision360.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Space Key</label>
            <input
              type="text"
              value={spaceKey}
              onChange={(e) => setSpaceKey(e.target.value)}
              className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="ISMS"
            />
          </div>
          <button
            onClick={handleImport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Import Pages'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Imported {result.pageCount} pages from {result.space}
            </h2>
            <button
              onClick={downloadAll}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Download All as JSON
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium">
                Pages
              </div>
              <div className="max-h-96 overflow-y-auto">
                {result.pages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => setSelectedPage(page)}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b dark:border-gray-700 ${
                      selectedPage?.id === page.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                  >
                    <div className="font-medium">{page.title}</div>
                    <div className="text-sm text-gray-500">{page.path}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium flex justify-between items-center">
                <span>Preview</span>
                {selectedPage && (
                  <button
                    onClick={() => downloadMdx(selectedPage)}
                    className="text-sm px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Download MDX
                  </button>
                )}
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {selectedPage ? (
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {selectedPage.fullMdx}
                  </pre>
                ) : (
                  <p className="text-gray-500">Select a page to preview</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
