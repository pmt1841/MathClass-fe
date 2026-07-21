import { Header } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { Experience } from '@/components/landing/experience'
import { CTA } from '@/components/landing/cta'

export const metadata = {
  title: 'Math Class — Học Toán Trực Quan & Tương Tác',
  description: 'Nền tảng học Toán thông minh — khám phá hình học, đồ thị và công thức tương tác như GeoGebra. Giáo viên thiết lập bài học, học viên học bằng cách thực hành.',
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <Header />
      <div className="flex-1">
        <Hero />
        <Features />
        <Experience />
        <CTA />
      </div>
      <Footer />
    </main>
  )
}
