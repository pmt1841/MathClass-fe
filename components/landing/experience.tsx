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
                    "Sử dụng công cụ Vẽ Hình/Đồ thị ngay trong soạn bài",
                    "Nhận xét trực tiếp trên bài làm của học sinh",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative aspect-square md:aspect-[4/3] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-xl group">
                <style>{`
                  @keyframes auto-slide-teacher {
                    0%, 45% { opacity: 1; }
                    50%, 95% { opacity: 0; }
                    100% { opacity: 1; }
                  }
                  .slide-teacher-1 { animation: auto-slide-teacher 6s infinite; }
                  .slide-teacher-2 { animation: auto-slide-teacher 6s infinite -3s; }
                `}</style>

                {/* Window Frame (Thanh cửa sổ) */}
                <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex gap-1.5 z-20 relative shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                </div>

                {/* Images Area */}
                <div className="relative w-full h-[calc(100%-28px)] bg-slate-50">
                  <img
                    src="/teacher-assignment.png"
                    alt="Giao diện chấm bài"
                    className="slide-teacher-1 absolute inset-0 w-full h-full object-cover object-top"
                  />
                  <img
                    src="/teacher-comment.png"
                    alt="Giao diện nhận xét"
                    className="slide-teacher-2 absolute inset-0 w-full h-full object-cover object-top"
                  />
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
                    "Tính năng lưu nháp không lo mất dữ liệu",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative aspect-square md:aspect-[4/3] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-xl group">
                <style>{`
                  @keyframes auto-slide-student {
                    0%, 45% { opacity: 1; }
                    50%, 95% { opacity: 0; }
                    100% { opacity: 1; }
                  }
                  .slide-student-1 { animation: auto-slide-student 6s infinite; }
                  .slide-student-2 { animation: auto-slide-student 6s infinite -3s; }
                `}</style>

                {/* Window Frame (Thanh cửa sổ) */}
                <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex gap-1.5 z-20 relative shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                </div>

                {/* Images Area */}
                <div className="relative w-full h-[calc(100%-28px)] bg-slate-50">
                  <img
                    src="/student-submission.png"
                    alt="Giao diện soạn công thức"
                    className="slide-student-1 absolute inset-0 w-full h-full object-cover object-top"
                  />
                  <img
                    src="/student-drawing.png"
                    alt="Giao diện vẽ đồ thị"
                    className="slide-student-2 absolute inset-0 w-full h-full object-cover object-top"
                  />
                </div>


              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
