 'use client'

 import { BookOpen, Brain, BarChart3, Zap, Users, Clock } from 'lucide-react'

 const features = [
   {
     icon: Brain,
     title: 'Gia sư AI',
     description: 'Nhận giải thích tức thời và gợi ý được cá nhân hóa cho bất kỳ bài toán nào'
   },
   {
     icon: BookOpen,
     title: 'Bài học tương tác',
     description: 'Tương tác với các giải thích hoạt hình phong phú về các khái niệm phức tạp'
   },
   {
     icon: Zap,
     title: 'Phản hồi tức thời',
     description: 'Biết ngay lập tức câu trả lời của bạn có đúng không và tại sao'
   },
   {
     icon: BarChart3,
     title: 'Phân tích tiến độ',
     description: 'Hình dung sự phát triển của bạn với các chỉ số hiệu suất chi tiết'
   },
   {
     icon: Users,
     title: 'Tích hợp lớp học',
     description: 'Đồng bộ hóa với lớp của bạn và cạnh tranh trên bảng xếp hạng'
   },
   {
     icon: Clock,
     title: 'Học theo tốc độ riêng',
     description: 'Không có giới hạn thời gian - luyện tập bất cứ khi nào và ở bất kỳ đâu'
   }
 ]

 export function Features() {
   return (
     <section id="features" className="px-6 py-20 md:py-32 bg-muted/30">
       <div className="mx-auto max-w-6xl">
         <div className="text-center space-y-4 mb-16">
           <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
             Các tính năng mạnh mẽ để thành công
           </h2>
           <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
             Mọi thứ bạn cần để chinh phục toán học và xây dựng sự tự tin bền vững
           </p>
         </div>

         <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
           {features.map((feature, index) => {
             const Icon = feature.icon
             return (
               <div
                 key={index}
                 className="rounded-xl bg-white p-8 border border-border hover:border-primary/50 transition-all hover:shadow-lg group"
               >
                 <div className="flex items-start gap-4">
                   <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-primary/10 transition-colors flex-shrink-0">
                     <Icon className="h-6 w-6 text-primary" />
                   </div>
                   <div className="flex-1">
                     <h3 className="font-semibold text-foreground text-lg mb-2">
                       {feature.title}
                     </h3>
                     <p className="text-muted-foreground">
                       {feature.description}
                     </p>
                   </div>
                 </div>
               </div>
             )
           })}
         </div>
       </div>
     </section>
   )
 }

