// Layout for HealthTalk Documentation
import { getEnhancedPageMap } from '@components/get-page-map'
import type { Metadata } from 'next'
import { Layout } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import type React from 'react'
import { AuthProvider } from '../lib/contexts/AuthContext'
import { getUser } from '../lib/auth/server'
import { isCrossDomainMode } from '../lib/auth/config'
import './globals.css'

export const metadata: Metadata = {
  description: 'HealthTalk Documentation - Help center and knowledge base.',
  metadataBase: new URL('https://docs.healthtalk.ai'),
  keywords: [
    'HealthTalk',
    'MEDrecord',
    'Documentation',
    'Help',
    'Knowledge Base',
    'Healthcare'
  ],
  generator: 'Next.js',
  applicationName: 'HealthTalk Docs',
  appleWebApp: {
    title: 'HealthTalk Docs'
  },
  title: {
    default: 'HealthTalk Documentation',
    template: '%s | HealthTalk Docs'
  },
  openGraph: {
    url: './',
    siteName: 'HealthTalk Docs',
    locale: 'en_US',
    type: 'website'
  },
  other: {
    'msapplication-TileColor': '#001B9F'
  },
  twitter: {
    site: 'https://healthtalk.ai'
  },
  alternates: {
    canonical: './'
  }
}

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  // Fetch page map first
  const pageMap = await getEnhancedPageMap()
  
  // In cross-domain mode, user is managed via localStorage on the client
  // In same-domain mode, we can fetch the user server-side using cookies
  const isCrossDomain = isCrossDomainMode()
  const user = isCrossDomain 
    ? null  // Client will handle auth via localStorage
    : await getUser().catch(() => null)
  
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={null}
          pageMap={pageMap}
          editLink={null}
          feedback={{ content: null }}
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          footer={null}
          copyPageButton={false}
          toc={{ float: false, extraContent: null, backToTop: null }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}

export default RootLayout
