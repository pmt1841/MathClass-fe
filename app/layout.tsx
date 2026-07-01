import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import QueryProvider from '@/components/providers/query-provider'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: 'Math Class - Master Mathematics',
  description:
    'Learn mathematics at your own pace with Math Class. Interactive lessons, practice problems, and personalized guidance to help you master every concept.',
}

import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className="bg-background">
      <body className="font-sans antialiased">
        <QueryProvider>
          {children}
          <Toaster position="top-right" richColors />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </QueryProvider>
      </body>
    </html>
  )
}
