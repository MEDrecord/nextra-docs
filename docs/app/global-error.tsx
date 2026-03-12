'use client'

/**
 * Global Error Page
 * 
 * Handles uncaught errors at the root layout level.
 * This replaces the entire page including the layout.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full px-6 py-12 text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">500</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Server Error
            </h2>
            <p className="text-gray-600 mb-8">
              Something went wrong on our end. Please try again later.
            </p>
            {error.digest && (
              <p className="text-sm text-gray-500 mb-6">
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
