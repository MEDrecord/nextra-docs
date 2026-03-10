import { redirect } from 'next/navigation'

export default function BuiltInsPage() {
  redirect('/docs')
}

export function generateStaticParams() {
  return []
}
