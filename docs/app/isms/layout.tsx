import type React from 'react'

/**
 * ISMS Layout with caching enabled
 * 
 * This layout enables static generation with revalidation for ISMS pages.
 * Pages will be cached for 5 minutes and served from edge cache.
 */

// Enable ISR with 5 minute revalidation
export const revalidate = 300

// Allow dynamic params for nested ISMS pages
export const dynamicParams = true

export default function ISMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
