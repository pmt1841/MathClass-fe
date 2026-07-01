import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, GraduationCap, Presentation, PenTool, Calculator } from "lucide-react"

export function Experience() {
  return (
    <section className="py-24 bg-white px-4 border-y border-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            Trải Nghiệm Kép Hoàn Hảo
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Thiết kế tối ưu hóa luồng công việc cho cả hai phía: người dạy và người học.
          </p>
        </div>

        <Tabs defaultValue="teacher" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 h-14 p-1 mb-12 bg-slate-100 rounded-xl">
            <TabsTrigger value="teacher" className="rounded-lg text-base font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
              <Presentation className="w-5 h-5 mr-2" /> Góc nhìn Giáo viên
            </TabsTrigger>
            <TabsTrigger value="student" className="rounded-lg text-base font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
              <GraduationCap className="w-5 h-5 mr-2" /> Góc nhìn Học sinh
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="teacher" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900">
                  Chấm Bài Trực Quan, <br />Tiết Kiệm 50% Thời Gian
                </h3>
                <ul className="space-y-4">
                  {[
                    "Giao bài tập tự luận định dạng chuẩn xác",
                    "Chấm điểm trực tiếp lên từng dòng bài làm của học sinh",
                    "Khoanh vùng lỗi sai và để lại nhận xét (Feedback) chi tiết",
                    "Quản lý tiến độ và phổ điểm của cả lớp dễ dàng"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative aspect-square md:aspect-[4/3] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100" />
                <PenTool className="w-24 h-24 text-blue-200" />
                <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 text-sm font-medium text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Đã chấm xong
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="student" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900">
                  Làm Bài Mượt Mà <br />Như Viết Trên Giấy
                </h3>
                <ul className="space-y-4">
                  {[
                    "Trình bày lời giải từng bước rõ ràng, logic",
                    "Sử dụng công cụ Vẽ Hình/Đồ thị ngay trong bài làm",
                    "Tự động lưu nháp (Auto-save) không lo mất dữ liệu",
                    "Xem ngay điểm số và lời phê chi tiết sau khi nộp"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative aspect-square md:aspect-[4/3] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-slate-100" />
                <Calculator className="w-24 h-24 text-indigo-200" />
                <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 text-sm font-mono text-slate-600">
                  f(x) = x² + 2x + 1
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
