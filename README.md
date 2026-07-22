# 🎓 MathClass UI - Frontend System

**MathClass UI** là ứng dụng Web Frontend chính thức dành cho **Hệ thống Quản lý & Học trực tuyến môn Toán (MathClass)**. Được xây dựng trên nền tảng **Next.js 16 (App Router)**, **React 19**, **TypeScript**, và **Tailwind CSS**, ứng dụng mang lại trải nghiệm học tập và quản lý lớp học trực quan, mượt mà, tối ưu hóa cho các công thức, đồ thị và bài tập toán học.

---

## 📌 Mục lục

- [✨ Tính năng chính](#-tính-năng-chính)
- [🛠 Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [📁 Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [🚀 Hướng dẫn cài đặt & Chạy ứng dụng](#-hướng-dẫn-cài-đặt--chạy-ứng-dụng)
- [🔑 Biến môi trường](#-biến-môi-trường)
- [🛡 Phân quyền & Điều hướng (Middleware Proxy)](#-phân-quyền--điều-hướng-middleware-proxy)
- [🧪 Kiểm thử & Đảm bảo chất lượng](#-kiểm-thử--đảm-bảo-chất-lượng)

---

## ✨ Tính năng chính

### 🔐 1. Xác thực & Phân quyền (Authentication & Authorization)
- **Đăng nhập & Đăng ký đa vai trò**: Hỗ trợ Học sinh (Student), Giáo viên (Teacher) và Quản trị viên (Admin).
- **Google OAuth Integration**: Đăng nhập nhanh bằng tài khoản Google (`@react-oauth/google`).
- **Quản lý phiên làm việc**: Xác thực qua JWT Token lưu trữ an toàn trong Cookie (`mathclass_jwt`, `mathclass_role`).
- **Khôi phục tài khoản**: Quên mật khẩu, đặt lại mật khẩu và xác minh mã OTP qua Email.

### 📚 2. Quản lý Lớp học (Classroom Management)
- **Giáo viên**:
  - Tạo lớp học mới, chỉnh sửa thông tin lớp, cấp mã tham gia lớp (Class Code).
  - Duyệt hoặc từ chối danh sách học sinh xin vào lớp (Join Requests).
  - Quản lý danh sách học sinh trong từng lớp.
- **Học sinh**:
  - Tìm kiếm lớp học, gửi yêu cầu tham gia lớp bằng mã truy cập.
  - Xem danh sách các lớp đã tham gia và theo dõi thông báo từ giáo viên.

### 📝 3. Quản lý Bài tập & Nộp bài (Assignments & Submissions)
- **Soạn thảo công thức & đồ thị toán học**:
  - Tích hợp **MathLive** và **KaTeX** hỗ trợ gõ công thức toán học chuẩn LaTeX.
  - Hỗ trợ **JSXGraph** để vẽ đồ thị hàm số và hình học tương tác.
  - Trình soạn thảo văn bản phong phú **TipTap** hỗ trợ định dạng bảng, hình ảnh, liên kết và công thức.
- **Giao bài & Nộp bài**:
  - Giáo viên tạo bài tập với hạn nộp, loại bài tập và nội dung câu hỏi chi tiết.
  - Học sinh làm bài trực tuyến, đính kèm bài giải/hình vẽ, xem điểm số và lời nhận xét của giáo viên.

### 📊 4. Bảng điều khiển & Thống kê (Dashboard & Analytics)
- Báo cáo kết quả học tập trực quan bằng biểu đồ tương tác **Recharts**.
- Thống kê tiến độ hoàn thành bài tập, điểm trung bình và mức độ chuyên cần.

### 🛡 5. Trang Quản trị (Admin Portal)
- Trang quản trị riêng biệt tại đường dẫn `/admin`.
- Quản lý người dùng: Tìm kiếm, phân lại quyền (Roles), khóa/mở khóa tài khoản.
- Kho tài nguyên cộng đồng (Community Repository) & Nhật ký hệ thống (System Logs).

---

## 🛠 Công nghệ sử dụng

| Danh mục | Công nghệ |
| :--- | :--- |
| **Core Framework** | [Next.js 16 (App Router)](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), Radix UI Primitives, Lucide Icons, Sonner (Toast) |
| **State & Data Fetching** | Redux Toolkit, TanStack React Query v5, Axios |
| **Form & Validation** | React Hook Form, Formik, Yup, Zod, `@hookform/resolvers` |
| **Toán học & Editor** | MathLive, KaTeX, JSXGraph, TipTap Editor, React Markdown, Rehype/Remark |
| **Testing** | Vitest, React Testing Library, Playwright (E2E Testing), MSW |

---

## 📁 Cấu trúc thư mục

```text
MathClass-ui/
├── app/                  # Next.js App Router (Pages & Layouts)
│   ├── (auth)/           # Route group xác thực: login, signup, forgot-password, verify
│   ├── (dashboard)/      # Route group người dùng: home, classes, assignments, students, reports, profile
│   ├── admin/            # Route group quản trị: /admin/login, /admin/users, /admin/roles, /admin/logs
│   ├── forbidden/        # Trang báo lỗi 403 Forbidden
│   ├── layout.tsx        # Root Layout của ứng dụng
│   └── page.tsx          # Landing Page chính
├── components/           # UI Components tái sử dụng
│   ├── ui/               # Base components (Button, Dialog, Form, Input, Select...)
│   ├── assignments/      # Components quản lý bài tập
│   ├── auth/             # Components giao diện xác thực
│   ├── dashboard/        # Components bảng điều khiển
│   ├── landing/          # Components trang Landing Page
│   ├── layout/           # Header, Sidebar, Footer, Navigation
│   ├── profile/          # Components quản lý hồ sơ cá nhân
│   └── submission/       # Components nộp bài & chấm điểm
├── services/             # Axios API Services kết nối Backend Spring Boot
│   ├── authService.ts
│   ├── classroomService.ts
│   ├── assignmentService.ts
│   ├── submissionService.ts
│   └── adminService.ts
├── hooks/                # Custom React Hooks
├── lib/                  # Utility functions, Axios client instance
├── types/                # TypeScript Interfaces & Type definitions
├── proxy.ts              # Route Guard Middleware xử lý điều hướng & phân quyền
├── next.config.mjs       # Cấu hình Next.js (Redirects, Headers, Unoptimized Images)
└── specs/                # Tài liệu quy định tính năng & bảo mật frontend
```

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng

### Yêu cầu hệ thống
- **Node.js**: `>= 18.x` hoặc `>= 20.x`
- **npm**: `>= 9.x`

### Các bước khởi chạy

1. **Di chuyển vào thư mục dự án frontend**:
   ```bash
   cd MathClass-ui
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**:
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường**:
   Tạo file `.env` từ file mẫu `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. **Chạy ứng dụng ở môi trường Development**:
   ```bash
   npm run dev
   ```
   Sau đó mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000).

5. **Đóng gói & Chạy ở môi trường Production**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🔑 Biến môi trường

Các thông số cấu hình chính trong `.env`:

```env
# Đường dẫn API Backend (Spring Boot Service)
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Google OAuth Client ID cho tính năng đăng nhập Google
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

---

## 🛡 Phân quyền & Điều hướng (Middleware Proxy)

Bảo mật ứng dụng và kiểm soát quyền truy cập dựa trên file [`proxy.ts`](file:///d:/tien/codegym/Module_6/MathClass/MathClass-ui/proxy.ts):

| Loại Route | Đường dẫn | Quyền truy cập |
| :--- | :--- | :--- |
| **Public Routes** | `/`, `/login`, `/admin/login`, `/signup`, `/verify` | Tất cả người dùng |
| **Protected Routes** | `/home`, `/classes`, `/assignments`, `/profile`, `/settings` | Yêu cầu Đăng nhập (JWT Token) |
| **Teacher Only** | `/classes/create`, `/students`, `/reports` | Người dùng có vai trò `TEACHER` |
| **Student Only** | `/assignments/submit` | Người dùng có vai trò `STUDENT` |
| **Admin Only** | `/admin/*` (Ngoại trừ `/admin/login`) | Người dùng có vai trò `ADMIN` |

---

## 🧪 Kiểm thử & Đảm bảo chất lượng

Dự án sẵn sàng cho quy trình CI/CD với các lệnh kiểm thử sau:

- **Chạy Unit & Component Tests (Vitest)**:
  ```bash
  npm run test
  ```

- **Chạy End-to-End Tests (Playwright)**:
  ```bash
  npm run test:e2e
  ```

- **Kiểm tra Linting & Cú pháp mã nguồn (ESLint)**:
  ```bash
  npm run lint
  ```
