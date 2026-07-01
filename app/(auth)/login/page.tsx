import LoginForm from '@/components/auth/login-form'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <div className="relative w-full max-w-md z-10">
      <Suspense fallback={<div className="flex items-center justify-center p-8">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
