import SignupForm from '@/components/auth/signup-form'
import { Suspense } from 'react'

export default function SignupPage() {
  return (
    <div className="relative w-full max-w-md my-8 z-10">
      <Suspense fallback={<div className="flex items-center justify-center p-8">Đang tải...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  )
}
