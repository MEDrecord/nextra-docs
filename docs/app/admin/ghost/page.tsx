'use client'

import { useState } from 'react'

interface PostData {
  id: string
  title: string
  slug: string
  excerpt: string
  tags: string[]
  publishedAt: string
  mdxPreview: string
  fullMdx: string
}

interface ImportResult {
  success: boolean
  source: string
  postCount: number
  posts: PostData[]
}

export default function GhostImportPage() {
  const [tag, setTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null)

  const handleImport = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const params = new URLSearchParams()
      if (tag) params.append('tag', tag)
      
      const response = await fetch(`/api/ghost/import?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const downloadMdx = (post: PostData) => {
    const blob = new Blob([post.fullMdx], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${post.slug}.mdx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadAll = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result.posts, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ghost-faq-export.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Ghost CMS Import</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Import FAQ and help articles from Ghost CMS to use in Nextra docs and train the Helpdesk Agent.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Make sure you have set <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">GHOST_API_KEY</code> and <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">GHOST_API_URL</code> in v0 Vars.
        </p>
        
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Tag (optional)</label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 w-48"
              placeholder="faq"
            />
          </div>
          <button
            onClick={handleImport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Import Posts'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-600 dark:text-green-400">
              Successfully imported {result.postCount} posts from Ghost
            </p>
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Imported Posts</h2>
            <button
              onClick={downloadAll}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            >
              Download All as JSON
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {result.posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedPost?.id === post.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <h3 className="font-medium">{post.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{post.slug}</p>
                    {post.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {post.tags.map((tag) => (
                          <span key={tag} className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              {selectedPost ? (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold">{selectedPost.title}</h3>
                    <button
                      onClick={() => downloadMdx(selectedPost)}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800"
                    >
                      Download MDX
                    </button>
                  </div>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-80">
                    {selectedPost.fullMdx}
                  </pre>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Select a post to preview MDX
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
