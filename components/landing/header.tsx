'use client'

import { Calculator } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
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

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
              >
                Đăng nhập
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-white text-primary hover:bg-white/90 font-semibold shadow-sm">
                Dùng thử miễn phí
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
