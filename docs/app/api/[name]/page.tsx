import { redirect } from 'next/navigation'

export default function ApiPage() {
  redirect('/docs/api-reference')
}

export function generateStaticParams() {
  return []
}
