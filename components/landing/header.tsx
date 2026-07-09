'use client'

import { Calculator } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/verify')

  return (
    <header className="sticky top-0 z-50 w-full bg-primary shadow-sm">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Calculator className="h-6 w-6 text-accent-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">Math Class</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
