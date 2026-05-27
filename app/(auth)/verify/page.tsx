import { Suspense } from 'react'
import VerifyEmail from '@/components/auth/verify-email'
import { Loader2 } from 'lucide-react'

export default function VerifyPage() {
  return (
    <div className="relative w-full max-w-md my-8 z-10">
      <div className="bg-card p-8 rounded-2xl shadow-sm border border-border/50 text-center">
        <Suspense fallback={
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Đang tải...</p>
          </div>
        }>
          <VerifyEmail />
        </Suspense>
      </div>
    </div>
  )
}
