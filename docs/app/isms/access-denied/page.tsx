'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ISMSAccessDenied() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const required = searchParams.get('required')
  const current = searchParams.get('current')

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        {/* Shield Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <svg
            className="h-8 w-8 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Access Denied
        </h1>

        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          {reason === 'auth_failed' && (
            <p className="text-red-700 dark:text-red-300">
              Unable to verify your authentication. Please sign in again.
            </p>
          )}
          {reason === 'insufficient_role' && (
            <div className="text-red-700 dark:text-red-300">
              <p className="mb-2">
                You don't have permission to access this ISMS content.
              </p>
              <p className="text-sm">
                <span className="font-medium">Required role:</span> {required || 'tenant_admin'}
                <br />
                <span className="font-medium">Your role:</span> {current || 'user'}
              </p>
            </div>
          )}
          {!reason && (
            <p className="text-red-700 dark:text-red-300">
              This ISMS content is restricted to authorized personnel only.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ISMS restricted content is only accessible to Security Officers and Management.
            If you believe you should have access, please contact your administrator.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/isms"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go to ISMS Overview
            </Link>
            <Link
              href="/isms/awareness"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Security Awareness
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Available to All Employees
          </h2>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>
              <Link href="/isms/policies" className="text-blue-600 hover:underline dark:text-blue-400">
                Security Policies
              </Link>
            </li>
            <li>
              <Link href="/isms/procedures" className="text-blue-600 hover:underline dark:text-blue-400">
                Security Procedures
              </Link>
            </li>
            <li>
              <Link href="/isms/awareness" className="text-blue-600 hover:underline dark:text-blue-400">
                Security Awareness Training
              </Link>
            </li>
            <li>
              <Link href="/isms/report-incident" className="text-blue-600 hover:underline dark:text-blue-400">
                Report an Incident
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
