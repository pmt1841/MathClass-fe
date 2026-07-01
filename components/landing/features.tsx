import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Compass, LineChart } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: <Calculator className="h-8 w-8 text-blue-600" />,
      title: "Trình Soạn Toán",
      description: "Gõ công thức nhanh chóng mượt mà. Hỗ trợ đầy đủ căn thức, phân số, ma trận, tích phân mà không cần phải học cú pháp LaTeX phức tạp."
    },
    {
      icon: <Compass className="h-8 w-8 text-indigo-600" />,
      title: "Không Gian Hình Học",
      description: "Vẽ điểm, đường thẳng, đa giác và đường tròn với độ chính xác tuyệt đối. Tự động nhận diện và tính toán các điểm giao cắt thông minh."
    },
    {
      icon: <LineChart className="h-8 w-8 text-violet-600" />,
      title: "Trình Vẽ Đồ Thị",
      description: "Nhập hàm số và vẽ đồ thị tức thì. Hỗ trợ khảo sát hàm, tìm cực trị và tương tác trực quan ngay trên trình duyệt web."
    }
  ]

  return (
    <section className="py-24 bg-slate-50 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            Bộ 3 Công Cụ Độc Quyền <br className="hidden sm:block" /> Dành Riêng Cho Toán THPT
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Trải nghiệm làm bài tự luận chân thực với bộ công cụ chuyên dụng được tích hợp sâu vào nền tảng.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, idx) => (
            <Card key={idx} className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl text-slate-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
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
