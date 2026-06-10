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

          {/* Navigation */}
          {!isAuthPage && (
            <nav className="hidden gap-8 md:flex">
              <a href="#features" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors">
                Tính năng
              </a>
              <a href="#learning" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors">
                Lộ trình học
              </a>
              <a href="#pricing" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors">
                Giá cả
              </a>
              <a href="#contact" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors">
                Liên hệ
              </a>
            </nav>
          )}

          {/* Auth */}
          {!isAuthPage && (
            <Link href="/login">
              <button className="rounded-lg bg-accent px-4 py-2 text-accent-foreground font-medium hover:opacity-90 transition-opacity">
                Đăng nhập
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
