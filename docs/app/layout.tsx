import { getEnhancedPageMap } from '@components/get-page-map'
import { ChatButton } from '@components/inkeep-chat-button'
import type { Metadata } from 'next'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
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
    'msapplication-TileColor': '#2563EB'
  },
  twitter: {
    site: 'https://healthtalk.ai'
  },
  alternates: {
    canonical: './'
  }
}

// Simple text logo for iframe embedding
const navbar = (
  <Navbar
    logo={
      <span className="font-semibold text-lg text-primary">
        Documentation
      </span>
    }
  />
)

// Minimal footer for iframe
const footer = (
  <Footer className="flex-col items-center md:items-start">
    <p className="text-xs text-muted-foreground">
      © {new Date().getFullYear()} HealthTalk - MEDrecord
    </p>
  </Footer>
)

const RootLayout: FC<LayoutProps<'/'>> = async ({ children }) => {
  const pageMap = await getEnhancedPageMap()
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <ChatButton />
        <Layout
          navbar={navbar}
          pageMap={pageMap}
          editLink={null}
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}

export default RootLayout
