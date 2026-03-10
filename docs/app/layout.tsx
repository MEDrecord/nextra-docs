import { getEnhancedPageMap } from '@components/get-page-map'
import type { Metadata } from 'next'
import { Layout } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import type { FC } from 'react'
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

const RootLayout: FC<LayoutProps<'/'>> = async ({ children }) => {
  const pageMap = await getEnhancedPageMap()
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
          toc={{ extraContent: null }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}

export default RootLayout
