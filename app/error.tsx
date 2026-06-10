'use client' // Error components must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCcw, ArrowLeft } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-transparent px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 mb-8 shadow-sm">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>

        <h1 className="text-7xl font-black text-slate-900 mb-4 tracking-tight">500</h1>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Đã xảy ra lỗi hệ thống</h2>

        <p className="text-slate-500 mb-10 leading-relaxed">
          Rất xin lỗi, ứng dụng vừa gặp sự cố ngoài ý muốn trong quá trình xử lý. Vui lòng thử lại sau.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <button
            onClick={() => reset()}
            className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/25 active:scale-95"
          >
            <RefreshCcw className="h-4 w-4" />
            Thử lại ngay
          </button>
          
          <Link
            href="/home"
            className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-white border border-border px-8 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
