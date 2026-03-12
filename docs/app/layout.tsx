// Layout for HealthTalk Documentation
import { getEnhancedPageMap } from '@components/get-page-map'
import type { Metadata } from 'next'
import { Layout } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import type React from 'react'
import { AuthProvider } from '../lib/contexts/AuthContext'
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
  const pageMap = await getEnhancedPageMap()
  
  // Authentication is handled entirely client-side via AuthProvider
  // This allows the layout to remain static for better performance and SEO
  // The AuthContext fetches user data on mount using cookies or localStorage
  
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <AuthProvider>
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
        </AuthProvider>
      </body>
    </html>
  )
}

export default RootLayout
