import { Header } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { Experience } from '@/components/landing/experience'
import { CTA } from '@/components/landing/cta'

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
