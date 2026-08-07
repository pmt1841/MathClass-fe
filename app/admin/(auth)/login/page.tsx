import { Metadata } from 'next'
import { Suspense } from 'react'
import AdminLoginForm from '@/components/auth/admin-login-form'
import { Spinner } from '@/components/ui/spinner'
import { Header } from '@/components/landing/header'

export const metadata: Metadata = {
  title: 'Đăng nhập Quản trị | MathClass',
  description: 'Trang đăng nhập hệ thống dành riêng cho Quản trị viên MathClass',
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* Body Container */}
      <main className="relative flex flex-1 items-center justify-center p-4 overflow-hidden">
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
