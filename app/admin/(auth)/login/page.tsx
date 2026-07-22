import { Metadata } from 'next'
import { Suspense } from 'react'
import AdminLoginForm from '@/components/auth/admin-login-form'
import { Spinner } from '@/components/ui/spinner'
import { Calculator } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Đăng nhập Quản trị | MathClass',
  description: 'Trang đăng nhập hệ thống dành riêng cho Quản trị viên MathClass',
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header đồng bộ với Dashboard Header */}
      <header className="w-full bg-primary shadow-sm">
        <div className="mx-auto max-w-screen-xl px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <Calculator className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">Math Class</span>
          </Link>
          <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Cổng Quản trị Hệ thống
          </span>
        </div>
      </header>

      {/* Body Container */}
      <main className="relative flex flex-1 items-center justify-center p-4 overflow-hidden">
        {/* Ambient background light matching theme */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <Suspense
            fallback={
              <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card p-8 shadow-xl">
                <Spinner className="h-8 w-8 text-primary" />
              </div>
            }
          >
            <AdminLoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
