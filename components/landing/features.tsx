import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Compass, LineChart, BookOpen } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: <Compass className="h-8 w-8 text-blue-600" />,
      title: "Hình Học Tương Tác",
      description: "Vẽ và khám phá hình học trực tiếp — kéo điểm, quan sát góc thay đổi, kiểm chứng định lý ngay tức thì. Học bằng tay thay vì chỉ nhìn vào sách."
    },
    {
      icon: <LineChart className="h-8 w-8 text-indigo-600" />,
      title: "Đồ Thị & Hàm Số",
      description: "Nhập hàm số, quan sát đồ thị biến đổi theo thời gian thực. Khảo sát cực trị, tìm giao điểm, hiểu ý nghĩa hình học của đạo hàm một cách trực quan."
    },
    {
      icon: <Calculator className="h-8 w-8 text-violet-600" />,
      title: "Soạn Thảo Công Thức",
      description: "Gõ và trình bày công thức Toán đẹp, chuẩn xác — từ phân số, căn thức đến ma trận và tích phân. Không cần LaTeX, không cần Word."
    },
    {
      icon: <BookOpen className="h-8 w-8 text-emerald-600" />,
      title: "Bài Học & Bài Tập",
      description: "Giáo viên thiết kế bài học tích hợp công cụ trực quan, giao bài tập cho từng lớp. Học viên làm bài ngay trong môi trường tương tác, giáo viên nhận xét trực tiếp."
    }
  ]

  return (
    <section className="py-24 bg-slate-50 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            Học Toán Theo Cách Bạn Chưa Thử
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Bộ công cụ tương tác được thiết kế riêng cho Toán — giúp học viên thực sự <em>hiểu</em>, không chỉ làm theo công thức.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <Card key={idx} className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg text-slate-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
