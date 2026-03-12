import { Suspense } from 'react'
import Link from 'next/link'
import { AccessDeniedContent } from './access-denied-content'

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )
}

export default function ISMSAccessDeniedPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AccessDeniedContent />
    </Suspense>
  )
}
