import { FileText, User, Calendar, History, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface DocumentMetaProps {
  version: string
  status: 'draft' | 'review' | 'approved'
  approvedBy?: string
  approvedDate?: string
  lastModified?: string
  filePath: string // Path relative to repo root, e.g., "docs/app/isms/page.mdx"
}

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  review: {
    label: 'In Review',
    icon: AlertCircle,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
}

export function DocumentMeta({
  version,
  status,
  approvedBy,
  approvedDate,
  lastModified,
  filePath,
}: DocumentMetaProps) {
  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon
  
  // Construct GitHub history URL
  const gitHistoryUrl = `https://github.com/MEDrecord/nextra-docs/commits/main/${filePath}`

  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {/* Version */}
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <FileText className="h-4 w-4" />
          <span>Version {version}</span>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}>
          <StatusIcon className="h-3.5 w-3.5" />
          <span>{statusConfig.label}</span>
        </div>

        {/* Approved By */}
        {approvedBy && (
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <User className="h-4 w-4" />
            <span>{approvedBy}</span>
          </div>
        )}

        {/* Approved Date */}
        {approvedDate && (
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{approvedDate}</span>
          </div>
        )}

        {/* View History Link */}
        <a
          href={gitHistoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <History className="h-4 w-4" />
          <span>View history</span>
        </a>
      </div>

      {/* Last Modified */}
      {lastModified && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Last modified: {lastModified}
        </div>
      )}
    </div>
  )
}
