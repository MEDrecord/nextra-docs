import { redirect } from 'next/navigation'

export default function ApiPage() {
  // Redirect to Gateway docs (central API documentation)
  redirect('/docs/products/gateway')
}

export function generateStaticParams() {
  return []
}
