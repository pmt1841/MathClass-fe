import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import QueryProvider from '@/components/providers/query-provider'
import { StoreProvider } from '@/components/providers/StoreProvider'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: 'Math Class - Master Mathematics',
  description:
    'Learn mathematics at your own pace with Math Class. Interactive lessons, practice problems, and personalized guidance to help you master every concept.',
}

import { Toaster } from '@/components/ui/sonner'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { I18nProvider } from '@/lib/i18n/i18n-context'
import { cookies } from 'next/headers'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const initialLocale = cookieStore.get('NEXT_LOCALE')?.value || 'vi'

  return (
    <html lang={initialLocale} className="bg-background">
      <body className="font-sans antialiased">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <QueryProvider>
            <StoreProvider>
              <I18nProvider initialLocale={initialLocale}>
                {children}
                <Toaster position="top-right" richColors closeButton duration={3000} />
                {process.env.NODE_ENV === 'production' && <Analytics />}
              </I18nProvider>
            </StoreProvider>
          </QueryProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}

