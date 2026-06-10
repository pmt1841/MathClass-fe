import Link from 'next/link'
import { Calculator, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/50 px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 mb-8 shadow-sm">
          <Calculator className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-7xl font-black text-slate-900 mb-4 tracking-tight">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Không tìm thấy trang</h2>

        <p className="text-slate-500 mb-10 leading-relaxed">
          Trang bạn đang cố truy cập không tồn tại hoặc đã bị gỡ bỏ.
        </p>

        <Link
          href="/home"
          className="flex items-center gap-2.5 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/25 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  )
}
