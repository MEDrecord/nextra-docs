import Link from 'next/link'

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Tools</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Import and manage documentation from external sources.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/admin/confluence"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Confluence Import</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Import ISMS documentation and policies from Atlassian Confluence.
          </p>
          <div className="mt-4 text-blue-600 dark:text-blue-400 text-sm">
            Requires: CONFLUENCE_API_TOKEN
          </div>
        </Link>

        <Link 
          href="/admin/ghost"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Ghost Import</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Import FAQ and help articles from Ghost CMS.
          </p>
          <div className="mt-4 text-blue-600 dark:text-blue-400 text-sm">
            Requires: GHOST_API_KEY, GHOST_API_URL
          </div>
        </Link>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <div>
            <code className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
              GET /api/confluence/import?space=ISMS&email=your@email.com
            </code>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Import pages from Confluence space
            </p>
          </div>
          <div>
            <code className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
              GET /api/ghost/import?tag=faq
            </code>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Import posts from Ghost CMS
            </p>
          </div>
          <div>
            <code className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
              GET /api/knowledge/export?type=all&format=training
            </code>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Export knowledge for Helpdesk Agent training
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
