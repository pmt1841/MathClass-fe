 'use client'

 import { ArrowRight } from 'lucide-react'

 export function CTA() {
   return (
     <section className="px-6 py-20 md:py-32">
       <div className="mx-auto max-w-4xl">
         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-12 md:p-16 text-center">
           {/* Decorative background elements */}
           <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
           <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />

           <div className="relative space-y-6">
             <h2 className="text-4xl font-bold text-primary-foreground md:text-5xl">
               Sẵn sàng thay đổi kỹ năng toán học của bạn?
             </h2>
             <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
               Tham gia hàng ngàn học sinh đã cải thiện điểm số và xây dựng sự tự tin bền vững trong toán học
             </p>

             <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-center">
               <button className="flex items-center justify-center gap-2 rounded-lg bg-accent text-accent-foreground px-8 py-3 font-semibold hover:opacity-90 transition-opacity">
                 Bắt đầu ngay
                 <ArrowRight className="h-5 w-5" />
               </button>
               <button className="rounded-lg border-2 border-primary-foreground text-primary-foreground px-8 py-3 font-semibold hover:bg-white/10 transition-colors">
                 Lên lịch demo
               </button>
             </div>
           </div>
         </div>
       </div>
     </section>
   )
 }

