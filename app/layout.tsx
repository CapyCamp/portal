import type { Metadata, Viewport } from 'next'
import { Chewy } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CapyCampLayout } from '@/components/capy-camp-layout'
import { ClickSound } from '@/components/ClickSound'
import { LoadingGate } from '@/components/LoadingGate'
import AbstractProvider from '@/providers/AbstractProvider'
import './globals.css'

const chewy = Chewy({ weight: '400', subsets: ['latin'], display: 'swap' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0EA5E9',
}

const siteTitle = 'CapyCamp'
const siteDescription = 'Web3 Scouts'
const ogImage = '/og-image.png'

export const metadata: Metadata = {
  metadataBase: new URL('https://capycamp.xyz'),
  title: siteTitle,
  description: siteDescription,
  generator: 'v0.app',
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    images: [ogImage],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [ogImage],
  },
  icons: {
    icon: [
      {
        url: '/favicon_io/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon_io/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon_io/favicon.ico',
        type: 'image/x-icon',
      },
    ],
    apple: '/favicon_io/apple-touch-icon.png',
  },
  manifest: '/favicon_io/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${chewy.className} antialiased`}>
        <AbstractProvider>
          <LoadingGate>
            <CapyCampLayout>
              {children}
            </CapyCampLayout>
          </LoadingGate>
          <ClickSound />
        </AbstractProvider>
        <Analytics />
      </body>
    </html>
  )
}

