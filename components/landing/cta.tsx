import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTA() {
  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent" />
      <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl mb-6">
          Sẵn sàng thay đổi cách học Toán?
        </h2>
        <p className="text-lg text-blue-100/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          Đăng ký miễn phí ngay hôm nay để trải nghiệm toàn bộ tính năng soạn thảo toán học, vẽ hình và tương tác hai chiều thông minh.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/register">
            <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-base bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-xl shadow-blue-900/50">
              Bắt đầu miễn phí <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/about">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 text-base border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent">
              Tìm hiểu thêm
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
