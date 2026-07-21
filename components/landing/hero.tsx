'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, GraduationCap, Presentation } from "lucide-react"
import { useRouter } from "next/navigation"

export function Hero() {
  const router = useRouter()

  const handleLogin = (role: string) => {
    sessionStorage.setItem('selectedRole', role)
    router.push('/login')
  }

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden bg-white px-4 pt-12 pb-24 sm:pt-16 sm:pb-32 text-center">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <Badge variant="outline" className="mb-6 border-blue-200 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse" />
          Nền tảng Toán học Trực quan & Tương tác
        </Badge>

        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
          Hiểu Toán sâu hơn —{' '}
          <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            bằng cách nhìn thấy nó.
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg sm:text-xl text-slate-600 leading-relaxed">
          Dạy và học toán theo cách thông minh hơn
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            onClick={() => handleLogin('TEACHER')}
            size="lg"
            className="w-full sm:w-auto h-14 px-8 text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
          >
            <Presentation className="mr-2 h-5 w-5" />
            Tôi là Giáo viên
          </Button>
          <Button
            onClick={() => handleLogin('STUDENT')}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto h-14 px-8 text-base text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
          >
            <GraduationCap className="mr-2 h-5 w-5 text-slate-500" />
            Tôi là Học viên
          </Button>
        </div>

        {/* Trust signals */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Học tương tác trực tiếp trên trình duyệt
          </div>
          <div className="hidden sm:block text-slate-300">•</div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Miễn phí trải nghiệm
          </div>
          <div className="hidden sm:block text-slate-300">•</div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Không cần cài đặt
          </div>
        </div>
      </div>
    </section>
  )
}
