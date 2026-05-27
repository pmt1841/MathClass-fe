 'use client'

 import { Check } from 'lucide-react'

 const plans = [
   {
     name: 'Miễn phí',
     price: '0đ',
     period: 'Luôn miễn phí',
     description: 'Hoàn hảo để bắt đầu',
     features: [
       'Bài học cơ bản',
       '50 bài tập thực hành mỗi tháng',
       'Theo dõi tiến độ',
       'Hỗ trợ cộng đồng',
       'Truy cập di động'
     ],
     cta: 'Bắt đầu học',
     highlighted: false
   },
   {
     name: 'Premium',
     price: '99.000đ',
     period: 'mỗi tháng',
     description: 'Cho những người học tập nghiêm túc',
     features: [
       'Tất cả tính năng miễn phí',
       'Bài tập thực hành không giới hạn',
       'Gia sư được hỗ trợ bởi AI',
       'Hỗ trợ trò chuyện trực tiếp',
       'Phân tích nâng cao',
       'Trải nghiệm không có quảng cáo',
       'Truy cập ngoại tuyến',
       'Chấm điểm ưu tiên'
     ],
     cta: 'Bắt đầu dùng thử miễn phí',
     highlighted: true
   },
   {
     name: 'Pro',
     price: '149.000đ',
     period: 'mỗi tháng',
     description: 'Cho những người học tập có tham vọng',
     features: [
       'Tất cả tính năng premium',
       'Kế hoạch học tập được cá nhân hóa',
       'Giải thích bằng video',
       'Gia sư trực tiếp một-một',
       'Hỗ trợ bài tập về nhà',
       'Hướng dẫn chuẩn bị đại học',
       'Bộ bài tập tùy chỉnh',
       'Hỗ trợ chuyên gia'
     ],
     cta: 'Bắt đầu dùng thử miễn phí',
     highlighted: false
   }
 ]

 export function Pricing() {
   return (
     <section id="pricing" className="px-6 py-20 md:py-32">
       <div className="mx-auto max-w-6xl">
         <div className="text-center space-y-4 mb-16">
           <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
             Giá cả đơn giản, minh bạch
           </h2>
           <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
             Chọn gói phù hợp với mục tiêu học tập của bạn
           </p>
         </div>

         <div className="grid gap-8 md:grid-cols-3 lg:gap-6">
           {plans.map((plan, index) => (
             <div
               key={index}
               className={`rounded-2xl border-2 p-8 transition-all ${
                 plan.highlighted
                   ? 'border-primary bg-primary/5 shadow-xl relative scale-105'
                   : 'border-border bg-white hover:border-primary/30'
               }`}
             >
               {plan.highlighted && (
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-sm font-semibold text-accent-foreground">
                   Phổ biến nhất
                 </div>
               )}

               <div className="space-y-2 mb-6">
                 <h3 className="text-2xl font-bold text-foreground">
                   {plan.name}
                 </h3>
                 <p className="text-muted-foreground">
                   {plan.description}
                 </p>
               </div>

               <div className="space-y-2 mb-8">
                 <div className="flex items-baseline gap-2">
                   <span className="text-4xl font-bold text-foreground">
                     {plan.price}
                   </span>
                   <span className="text-muted-foreground">
                     {plan.period}
                   </span>
                 </div>
               </div>

               <button
                 className={`w-full rounded-lg font-semibold py-3 transition-all mb-8 ${
                   plan.highlighted
                     ? 'bg-primary text-primary-foreground hover:opacity-90'
                     : 'bg-muted text-foreground hover:bg-muted/80'
                 }`}
               >
                 {plan.cta}
               </button>

               <div className="space-y-4">
                 {plan.features.map((feature, featureIndex) => (
                   <div key={featureIndex} className="flex items-center gap-3">
                     <Check className="h-5 w-5 text-primary flex-shrink-0" />
                     <span className="text-muted-foreground">
                       {feature}
                     </span>
                   </div>
                 ))}
               </div>
             </div>
           ))}
         </div>

         <div className="mt-16 text-center">
           <p className="text-muted-foreground">
             Tất cả gói đều bao gồm dùng thử miễn phí 30 ngày. Không cần thẻ tín dụng.
           </p>
         </div>
       </div>
     </section>
   )
 }

