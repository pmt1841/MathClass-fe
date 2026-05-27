 'use client'

 import { ArrowRight, Sparkles } from 'lucide-react'
 import { useState } from 'react'

 export function Hero() {
   const [classCode, setClassCode] = useState('')

   return (
     <section className="relative overflow-hidden px-6 py-20 md:py-32">
       {/* Background gradient effect */}
       <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-background to-background" />

       <div className="mx-auto max-w-6xl">
         <div className="grid gap-12 md:grid-cols-2 md:gap-16 lg:gap-20">
           {/* Left Content */}
           <div className="flex flex-col justify-center space-y-8">
             {/* Badge */}
             <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-100 px-4 py-2">
               <Sparkles className="h-4 w-4 text-primary" />
               <span className="text-sm font-semibold text-primary">Học tập được hỗ trợ bởi AI</span>
             </div>

             {/* Main Headline */}
             <div className="space-y-4">
               <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground md:text-6xl">
                 Chinh phục Toán học,
                 <br />
                 <span className="text-primary">Học nhanh hơn</span>
               </h1>
               <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                 Bài học tương tác, phản hồi thời gian thực và hướng dẫn cá nhân hóa. Học toán học với tốc độ của riêng bạn cùng với hệ thống gia sư thông minh.
               </p>
             </div>

             {/* Class Code Input */}
             <div className="flex flex-col gap-4">
               <div className="flex gap-3 bg-white rounded-full p-1 border border-border shadow-sm">
                 <input
                   type="text"
                   placeholder="Nhập mã lớp"
                   value={classCode}
                   onChange={(e) => setClassCode(e.target.value)}
                   className="flex-1 px-4 py-2 bg-transparent outline-none text-foreground"
                 />
                 <button className="flex items-center justify-center h-10 w-10 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity flex-shrink-0">
                   <ArrowRight className="h-5 w-5" />
                 </button>
               </div>
               <p className="text-xs text-muted-foreground">
                 Hỏi giáo viên của bạn để nhận mã lớp
               </p>
             </div>

             {/* CTA Buttons */}
             <div className="flex flex-col gap-3 pt-4 sm:flex-row">
               <button className="rounded-full bg-primary text-primary-foreground px-8 py-3 font-semibold hover:opacity-90 transition-opacity">
                 Bắt đầu miễn phí
               </button>
               <button className="rounded-full border-2 border-primary text-primary px-8 py-3 font-semibold hover:bg-primary/5 transition-colors">
                 Tìm hiểu thêm
               </button>
             </div>
           </div>

           {/* Right Features Card */}
           <div className="relative">
             {/* Card Background */}
             <div className="rounded-2xl bg-white border border-border shadow-lg p-8">
               <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-accent/20 blur-3xl" />

               <h2 className="text-2xl font-bold text-foreground mb-8">Tại sao chọn Math Class?</h2>

               <div className="space-y-6">
                 {/* Feature 1 */}
                 <div className="flex gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                     <span className="text-2xl">✓</span>
                   </div>
                   <div>
                     <h3 className="font-semibold text-foreground mb-1">Gia sư trực tiếp</h3>
                     <p className="text-sm text-muted-foreground">
                       Bài học tương tác với giải thích từng bước và phản hồi thời gian thực
                     </p>
                   </div>
                 </div>

                 {/* Feature 2 */}
                 <div className="flex gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                     <span className="text-2xl">📝</span>
                   </div>
                   <div>
                     <h3 className="font-semibold text-foreground mb-1">Bài tập thực hành</h3>
                     <p className="text-sm text-muted-foreground">
                       Hàng ngàn bài tập với gợi ý, lời giải và chấm điểm tức thời
                     </p>
                   </div>
                 </div>

                 {/* Feature 3 */}
                 <div className="flex gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                     <span className="text-2xl">📊</span>
                   </div>
                   <div>
                     <h3 className="font-semibold text-foreground mb-1">Theo dõi tiến độ</h3>
                     <p className="text-sm text-muted-foreground">
                       Phân tích chi tiết về sự phát triển của bạn trên tất cả các chủ đề và kỹ năng
                     </p>
                   </div>
                 </div>

                 {/* Feature 4 */}
                 <div className="flex gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                     <span className="text-2xl">🎯</span>
                   </div>
                   <div>
                     <h3 className="font-semibold text-foreground mb-1">Lộ trình cá nhân</h3>
                     <p className="text-sm text-muted-foreground">
                       Học tập thích ứng điều chỉnh theo tốc độ và phong cách học tập của bạn
                     </p>
                   </div>
                 </div>
               </div>

               {/* Free badge */}
               <div className="mt-8 pt-6 border-t border-border">
                 <p className="text-sm font-semibold text-accent">✓ Miễn phí sử dụng</p>
               </div>
             </div>
           </div>
         </div>
       </div>
     </section>
   )
 }

