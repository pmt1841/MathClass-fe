# Tổng Quan Dự Án MathClass (Frontend)

Chào mừng bạn đến với module Frontend của dự án **MathClass** - Nền tảng quản lý học tập (LMS) và luyện tập Toán trực tuyến tích hợp trợ lý AI thông minh và bộ công cụ tương tác Toán học chuyên sâu.

---

## 1. Mục Tiêu & Các Phân Hệ Người Dùng

Frontend được xây dựng nhằm cung cấp trải nghiệm học tập, giảng dạy và quản trị trực quan, hiện đại, tối ưu hóa tối đa cho các công thức Toán học chuẩn LaTeX và đồ thị hình học:

### 🎓 Phân Hệ Học Sinh (Student Portal):
- **Làm bài & Nộp bài Toán học:** Soạn thảo công thức LaTeX bằng MathLive/KaTeX, vẽ hình học tương tác trên JSXGraph, nhận diện công thức viết tay qua Canvas (AI Handwriting OCR).
- **Học tập cùng AI (AI Student Hints):** Nhận gợi ý giải toán từng bước có kiểm soát mà không làm lộ đáp án hoàn chỉnh.
- **Tương tác Lớp học & Bạn Cùng Lớp:** Xem danh sách bạn cùng lớp với trạng thái Online (trong 5 phút gần nhất), gửi yêu cầu tham gia lớp học.
- **Quản lý Hạn ngạch & Credit (`/credits`):** Theo dõi số dư credit cá nhân, lịch sử chi tiêu credit qua Credit Ledger và mua thêm gói credit.

### 👨‍🏫 Phân Hệ Giáo Viên (Teacher Portal):
- **Soạn đề & Quản lý Bài tập:** Tạo bài tập đơn lẻ hoặc Phiếu bài tập (Assignment Sheet), cấu hình thời hạn nộp theo từng lớp học.
- **Trợ lý Sinh đề AI (AI Question Generator):** Tự động sinh đề bài toán học theo phân loại Bloom, chuyên đề, kèm tùy chọn đồ thị JSXGraph.
- **Chấm điểm & Nhận xét Trực quan:** Chấm điểm trắc nghiệm/tự luận, hỗ trợ AI Automated Grading, và **nhận xét bôi đen trực tiếp trên bài làm** (Inline Submission Comments).
- **Quản lý Lớp học & Cảnh báo Học tập:** Duyệt học sinh vào lớp, theo dõi tiến độ và bảng cảnh báo học sinh có nguy cơ học kém (`at-risk-students`).
- **Kho Bài tập Cộng đồng (Library):** Chia sẻ và sao chép (clone) đề bài từ thư viện dùng chung.

### 🛡 Phân Hệ Quản Trị Viên (Admin Portal - `/admin`):
- **Bảo Mật Cấp Cao (2FA TOTP):** Xác thực 2 bước bằng Google Authenticator và mã dự phòng khi đăng nhập.
- **Quản Trị Người Dùng & Phân Quyền (RBAC):** Quản lý tài khoản, khóa tài khoản có kèm lý do, gán permissions theo role, khôi phục quyền mặc định.
- **Trung Tâm Cấu Hình AI Toàn Diện (`/admin/ai-config`):** Quản lý AI Provider, API Keys (mã hóa AES-256), Task Routing, System Prompts có Versioning & Live Preview, Quản lý Credit Quota.
- **Quản Lý Báo Cáo Lỗi (`/admin/bug-reports`):** Tiếp nhận và điều phối xử lý lỗi người dùng.
- **Nhật Ký Hoạt Động (`/admin/logs`):** Tra cứu System Audit Logs.

---

## 2. Kiến Trúc & Công Nghệ (Architecture & Tech Stack)

- **Framework Chính:** [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/).
- **Ngôn ngữ:** TypeScript 5.7+ (Strict Type-checking).
- **Giao diện & Styling:** [Tailwind CSS v4](https://tailwindcss.com/), Radix UI Primitives (shadcn/ui), Lucide Icons, Recharts.
- **Quản lý State & Dữ liệu:**
  - **Server State:** [TanStack React Query v5](https://tanstack.com/query/latest) (Tích hợp `keepPreviousData` cho phân trang Server-side).
  - **Client Auth State:** Redux Toolkit (`authSlice`).
  - **HTTP Client:** Axios Instance tập trung tại `@/lib/axios` (Tự động xoay vòng Refresh Token & xử lý tài khoản bị khóa).
- **Công cụ Toán học & Soạn thảo:** MathLive, KaTeX, JSXGraph (với tùy chỉnh Text & Hệ trục/Lưới tọa độ), TipTap Rich-text Editor.
- **Kiểm thử chất lượng:** Vitest, React Testing Library, Playwright (E2E), MSW (Mock Service Worker).

---

## 3. Các Tài Liệu Chi Tiết

Hãy đọc các tài liệu hướng dẫn tiếp theo để bắt tay vào phát triển:

1. [Hướng dẫn Cài đặt Môi trường (Setup Guide)](02-setup-guide.md)
2. [Quy chuẩn và Hướng dẫn Code (Frontend Guide)](03-frontend-guide.md)
3. [Kiến trúc Ứng dụng & Bản đồ API (Architecture)](04-architecture.md)
4. [Cấu trúc Thư mục Chi tiết (Folder Structure)](05-folder-structure.md)

