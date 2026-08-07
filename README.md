# 🎓 MathClass UI - Frontend System

**MathClass UI** là ứng dụng Web Frontend chính thức dành cho **Hệ thống Quản lý & Học trực tuyến môn Toán (MathClass)**. Được xây dựng trên nền tảng **Next.js 16 (App Router)**, **React 19**, **TypeScript**, và **Tailwind CSS**, ứng dụng mang lại trải nghiệm học tập và quản lý lớp học trực quan, mượt mà, tối ưu hóa cho các công thức, đồ thị và bài tập toán học.

---

## 📌 Mục lục

- [✨ Tính năng chính](#-tính-năng-chính)
- [🛠 Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [📁 Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [🚀 Hướng dẫn cài đặt & Chạy ứng dụng](#-hướng-dẫn-cài-đặt--chạy-ứng-dụng)
- [🔑 Biến môi trường](#-biến-môi-trường)
- [🛡 Phân quyền & Điều hướng (Proxy Middleware)](#-phân-quyền--điều-hướng-proxy-middleware)
- [🧪 Kiểm thử & Đảm bảo chất lượng](#-kiểm-thử--đảm-bảo-chất-lượng)
- [📚 Tài liệu bổ sung](#-tài-liệu-bổ-sung)

---

## ✨ Tính năng chính

### 🔐 1. Xác thực & Phân quyền (Authentication & Authorization)
- **Đăng nhập & Đăng ký đa vai trò**: Học sinh (STUDENT), Giáo viên (TEACHER) và Quản trị viên (ADMIN).
- **Google OAuth Integration**: Đăng nhập nhanh bằng tài khoản Google (`@react-oauth/google`).
- **JWT trong HttpOnly Cookie**: Token do Backend set qua cookie `mathclass_jwt`; role lưu trong `mathclass_role`. Hỗ trợ "Ghi nhớ đăng nhập" (`mathclass_remember`).
- **Tự động gia hạn token**: Axios interceptor xử lý 401 bằng hàng đợi refresh-token (mutex), kết hợp kiểm tra phiên theo tab (sessionStorage).
- **Khôi phục tài khoản**: Quên mật khẩu, đặt lại mật khẩu, xác minh email qua OTP/token.
- **Xử lý khóa tài khoản**: Backend trả `ACCOUNT_LOCKED` → tự động logout + hiển thị `AccountLockedModal`.

### 📚 2. Quản lý Lớp học (Classroom Management)
- **Giáo viên**: Tạo/chỉnh sửa lớp, cấp mã tham gia (Class Code), duyệt/từ chối yêu cầu vào lớp, quản lý danh sách học sinh.
- **Học sinh**: Tìm kiếm lớp bằng mã, gửi yêu cầu tham gia, xem danh sách lớp đã tham gia.

### 📝 3. Quản lý Bài tập & Nộp bài (Assignments & Submissions)
- **Soạn thảo công thức & đồ thị toán học**:
  - **MathLive** + **KaTeX** hỗ trợ gõ công thức LaTeX (`$...$`, `$$...$$`).
  - **JSXGraph** vẽ đồ thị hàm số và hình học tương tác (lưu dạng `[SHAPE_x]`).
  - **TipTap** rich-text editor (bảng, hình ảnh, liên kết, công thức).
  - Upload ảnh minh họa (mã `[IMAGE_x]`), OCR trích xuất chữ từ ảnh.
- **Giao bài & Nộp bài**:
  - Giáo viên tạo bài tập/bài tập phiếu (Assignment Sheet), giao cho nhiều lớp kèm hạn nộp riêng.
  - Học sinh làm bài online, vẽ hình bằng JSXGraph, lưu nháp hoặc nộp.
  - Giáo viên chấm điểm, ghi feedback, **nhận xét bôi đen trực tiếp trên bài nộp** (submission comments).
  - "Kho bài tập" quản lý theo trạng thái DRAFT / SINGLE / SHEET.

### 📊 4. Bảng điều khiển & Thống kê (Dashboard & Analytics)
- Dashboard riêng cho Giáo viên (lớp đang dạy, bài cần chấm, yêu cầu chờ duyệt, học sinh có nguy cơ) và Học sinh (bài chưa làm, điểm gần đây).
- Báo cáo trực quan bằng biểu đồ **Recharts**.

### 🛡 5. Trang Quản trị (Admin Portal - `/admin`)
- Quản lý người dùng: tìm kiếm, lọc theo vai trò, khóa/mở khóa tài khoản.
- Quản lý quyền hạn: gán permission cho từng role (`/admin/roles`), reset quyền mặc định.
- Cấu hình AI Services: quản lý Provider (OpenAI-compatible, Gemini, Anthropic...), API Keys, định tuyến task sang model.
- Nhật ký hệ thống (audit log) & Kho bài tập cộng đồng.

### 📚 6. Thư viện bài tập (Library)
- Tìm kiếm bài tập/phiếu bài tập công khai (`library:read`).
- Clone bài về kho cá nhân, chỉnh visibility PRIVATE/PUBLIC (`library:clone`).

### 🔔 7. Thông báo (Notifications)
- Hộp thông báo trên Header, phân trang cuộn vô hạn, đếm chưa đọc, đánh dấu đã đọc.

---

## 🛠 Công nghệ sử dụng

| Danh mục | Công nghệ |
| :--- | :--- |
| **Core Framework** | [Next.js 16 (App Router)](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), shadcn/ui (Radix UI Primitives), Lucide Icons, Sonner (Toast), Recharts |
| **State & Data Fetching** | Redux Toolkit (chỉ auth), TanStack React Query v5, Axios |
| **Form & Validation** | React Hook Form, Formik, Yup, Zod, `@hookform/resolvers` |
| **Toán học & Editor** | MathLive, KaTeX, JSXGraph, TipTap Editor, React Markdown, Rehype/Remark, marked + Turndown |
| **Testing** | Vitest, React Testing Library, Playwright (E2E), MSW |

---

## 📁 Cấu trúc thư mục

```text
MathClass-fe/
├── app/                  # Định tuyến Next.js App Router (Route Groups)
│   ├── (auth)/           #   Login, signup, verify, forgot/reset password
│   ├── (dashboard)/      #   Home, classes, assignments, students, reports, library, profile, settings
│   └── admin/            #   users, roles, ai-config, logs, community-repo
├── components/           # UI Components
│   ├── ui/               #   Base shadcn/ui + chuyên toán (JSXGraph, KaTeX, TipTap...)
│   ├── auth/             #   Form xác thực, modal khóa tài khoản...
│   ├── assignments/      #   Publish modal, submission table/detail, comments...
│   └── layout/           #   Header, Sidebar, Footer, NotificationPopover
├── services/             # Axios API Services (kết nối Backend Spring Boot)
├── hooks/                # Custom React Hooks (chủ yếu bọc React Query)
├── lib/                  # axios.ts, auth-storage.ts, Redux store, editor-utils...
├── types/                # TypeScript Interfaces & Type definitions
├── proxy.ts              # Route Guard / Middleware phân quyền (Next.js 16)
├── specs/                # Tài liệu quy định tính năng & bảo mật frontend
├── docs/                 # Tài liệu kỹ thuật (kiến trúc, setup, hướng dẫn code)
├── __tests__/            # Unit & Component tests (Vitest)
├── e2e/                  # End-to-end tests (Playwright)
└── next.config.mjs       # Cấu hình Next.js (Redirects, Headers, Unoptimized Images)
```

> Xem chi tiết từng thư mục trong [docs/05-folder-structure.md](docs/05-folder-structure.md).

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng

### Yêu cầu hệ thống
- **Node.js**: `>= 18.x` (khuyến nghị `>= 20.x`)
- **npm**: `>= 9.x`
- Backend Spring Boot (MathClass-service) đang chạy ở port **8080**

### Các bước khởi chạy

```bash
# 1. Cài đặt dependencies
npm install

# 2. Cấu hình biến môi trường (từ .env.example)
cp .env.example .env

# 3. Chạy môi trường Development
npm run dev
# Mở http://localhost:3000

# 4. Đóng gói & chạy Production
npm run build
npm run start
```

---

## 🔑 Biến môi trường

Các thông số cấu hình chính trong `.env`:

```env
# Đường dẫn API Backend (Spring Boot Service).
# Nếu chưa có tiền tố version, lib/axios.ts tự chèn /v1
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Google OAuth Client ID cho tính năng đăng nhập Google
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

---

## 🛡 Phân quyền & Điều hướng (Proxy Middleware)

Bảo mật ứng dụng và kiểm soát quyền truy cập dựa trên file [`proxy.ts`](proxy.ts) (Next.js 16 Proxy/Middleware). Bảng route:

| Loại Route | Đường dẫn | Quyền truy cập |
| :--- | :--- | :--- |
| **Public Routes** | `/`, `/login`, `/admin/login`, `/signup`, `/verify` | Tất cả người dùng |
| **Protected Routes** | `/home`, `/classes`, `/assignments`, `/students`, `/reports`, `/settings`, `/profile`, `/admin` | Yêu cầu Đăng nhập (JWT Cookie) |
| **Teacher Only** | `/classes/create`, `/students`, `/reports` | Người dùng có vai trò `TEACHER` |
| **Student Only** | `/assignments/submit` | Người dùng có vai trò `STUDENT` |
| **Admin Only** | `/admin/*` (Ngoại trừ `/admin/login`) | Người dùng có vai trò `ADMIN` |

Ngoài tầng proxy, frontend còn kiểm tra quyền chi tiết (permission) bằng `PermissionGuard` / `RoutePermissionGuard` (ví dụ: `library:read`, `library:clone`). Xem chi tiết trong [docs/04-architecture.md](docs/04-architecture.md#3-phân-quyền--route-guard).

---

## 🧪 Kiểm thử & Đảm bảo chất lượng

- **Chạy Unit & Component Tests (Vitest)**:
  ```bash
  npm run test
  ```
- **Chạy End-to-End Tests (Playwright)**:
  ```bash
  npm run test:e2e
  ```
- **Kiểm tra Linting & Cú pháp (ESLint)**:
  ```bash
  npm run lint
  ```

---

## 📚 Tài liệu bổ sung

| Tài liệu | Mô tả |
| :--- | :--- |
| [docs/01-overview.md](docs/01-overview.md) | Tổng quan dự án |
| [docs/02-setup-guide.md](docs/02-setup-guide.md) | Hướng dẫn cài đặt môi trường |
| [docs/03-frontend-guide.md](docs/03-frontend-guide.md) | Quy chuẩn & hướng dẫn phát triển |
| [docs/04-architecture.md](docs/04-architecture.md) | Kiến trúc ứng dụng (auth, RBAC, data fetching, API map) |
| [docs/05-folder-structure.md](docs/05-folder-structure.md) | Cấu trúc thư mục chi tiết |

