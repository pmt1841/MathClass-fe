'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, GraduationCap, Presentation } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"

export function Experience() {
  const { t } = useI18n()

  const teacherBullets = [
    t("Tạo bài học tích hợp công cụ trực quan (hình, đồ thị, công thức)"),
    t("Giao bài tập cho từng lớp học, đặt deadline"),
    t("Xem & nhận xét bài làm của học viên trực tiếp"),
    t("Theo dõi tiến độ học viên qua từng bài"),
  ]

  const studentBullets = [
    t("Học qua công cụ hình học & đồ thị tương tác như GeoGebra"),
    t("Làm bài tập ngay trong môi trường trực quan"),
    t("Trình bày lời giải từng bước với công cụ soạn thảo"),
    t("Lưu nháp, xem lại bài làm bất cứ lúc nào"),
  ]

  return (
    <section className="py-24 bg-white px-4 border-y border-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            {t("Thiết kế cho cả Giáo viên lẫn Học viên")}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t("Một nền tảng — hai luồng trải nghiệm tối ưu cho từng vai trò.")}
          </p>
        </div>

        <Tabs defaultValue="teacher" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 h-14 p-1 mb-12 bg-slate-100 rounded-xl">
            <TabsTrigger
              value="teacher"
              className="rounded-lg text-base font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
            >
              <Presentation className="w-5 h-5 mr-2" /> {t("Giáo viên")}
            </TabsTrigger>
            <TabsTrigger
              value="student"
              className="rounded-lg text-base font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
            >
              <GraduationCap className="w-5 h-5 mr-2" /> {t("Học viên")}
            </TabsTrigger>
          </TabsList>

          {/* Teacher Tab */}
          <TabsContent value="teacher" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900">
                  {t("Soạn bài, giao bài —")} <br />
                  {t("mọi thứ trong một không gian")}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {t("Giáo viên không chỉ giao đề, mà còn có thể nhúng hình học tương tác, đồ thị và công cụ vẽ trực tiếp vào bài học.")}
                </p>
                <ul className="space-y-4">
                  {teacherBullets.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600 leading-relaxed text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative aspect-square md:aspect-[4/3] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-xl">
                <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex gap-1.5 z-20 relative shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="relative w-full h-[calc(100%-28px)] bg-slate-50">
                  <img
                    src="/teacher-assignment.png"
                    alt={t("Giao diện giáo viên tạo bài tập")}
                    className="slide-teacher-1 absolute inset-0 w-full h-full object-cover object-top"
                  />
                  <img
                    src="/teacher-comment.png"
                    alt={t("Giao diện giáo viên nhận xét bài học viên")}
                    className="slide-teacher-2 absolute inset-0 w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Student Tab */}
          <TabsContent value="student" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900">
                  {t("Học Toán bằng cách")} <br />
                  {t("khám phá, không chỉ ghi nhớ")}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {t("Kéo điểm để thấy góc thay đổi. Điều chỉnh hệ số để đồ thị biến hình. Toán học trở nên sống động khi bạn tương tác với nó.")}
                </p>
                <ul className="space-y-4">
                  {studentBullets.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600 leading-relaxed text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative aspect-square md:aspect-[4/3] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-xl">
                <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex gap-1.5 z-20 relative shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="relative w-full h-[calc(100%-28px)] bg-slate-50">
                  <img
                    src="/student-submission.png"
                    alt={t("Giao diện học viên làm bài với công cụ soạn công thức")}
                    className="slide-student-1 absolute inset-0 w-full h-full object-cover object-top"
                  />
                  <img
                    src="/student-drawing.png"
                    alt={t("Giao diện học viên khám phá đồ thị tương tác")}
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
