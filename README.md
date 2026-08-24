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
- **Xác thực 2 bước (2FA Google Authenticator & Backup Codes)**: Bắt buộc 100% đối với vai trò Quản trị viên (`ADMIN`), hỗ trợ quét mã QR, nhập key thủ công và 8 mã dự phòng khẩn cấp.
- **Google OAuth Integration**: Đăng nhập nhanh bằng tài khoản Google (`@react-oauth/google`).
- **JWT trong HttpOnly Cookie**: Token do Backend set qua cookie `mathclass_jwt`; role lưu trong `mathclass_role`. Hỗ trợ "Ghi nhớ đăng nhập" (`mathclass_remember`).
- **Tự động gia hạn token**: Axios interceptor xử lý 401 bằng hàng đợi refresh-token (mutex), kết hợp kiểm tra phiên theo tab (sessionStorage).
- **Khôi phục tài khoản**: Quên mật khẩu, đổi mật khẩu kèm OTP, đặt lại mật khẩu, xác minh email.
- **Xử lý khóa tài khoản**: Backend trả `ACCOUNT_LOCKED` (kèm lý do khóa) → tự động logout + hiển thị `AccountLockedModal`.

### 📚 2. Quản lý Lớp học & Bạn Cùng Lớp (Classrooms & Classmates)
- **Giáo viên**: Tạo/chỉnh sửa lớp, cấp mã tham gia (Class Code), duyệt/từ chối yêu cầu vào lớp, quản lý danh sách học sinh.
- **Học sinh**: Tìm kiếm lớp bằng mã, gửi yêu cầu tham gia, xem danh sách lớp đã tham gia.
- **Danh sách bạn cùng lớp (Classmate List)**: Hiển thị bạn cùng lớp với trạng thái Online (trong 5 phút gần nhất), gắn tag "(Tôi)" và avatar fallback thông minh.

### 📝 3. Quản lý Bài tập & Nộp bài Toán học (Assignments & Submissions)
- **Soạn thảo công thức & đồ thị toán học tương tác**:
  - **MathLive** + **KaTeX**: Gõ và hiển thị công thức LaTeX mượt mà (`$...$`, `$$...$$`), bộ gõ toolbar toán học.
  - **JSXGraph nâng cao**: Vẽ hình học & đồ thị tương tác, chèn text vào hình vẽ, tùy chọn bật/tắt linh hoạt trục tọa độ và lưới ô vuông (lưu dạng `[SHAPE_x|options]`).
  - **TipTap**: Rich-text editor hỗ trợ bảng biểu, hình ảnh tải lên (`[IMAGE_x]`), liên kết, công thức toán.
- **Giao bài, Nộp bài & Chấm điểm**:
  - Giáo viên tạo bài tập đơn lẻ hoặc Phiếu bài tập (Assignment Sheet), giao cho nhiều lớp kèm hạn nộp độc lập.
  - Học sinh làm bài trực tuyến, vẽ hình tương tác, nhận diện chữ viết tay qua Canvas (AI Handwriting OCR), lưu nháp hoặc nộp bài.
  - Giáo viên chấm điểm, trả nhận xét và **bôi đen trực tiếp trên nội dung bài nộp** (Submission Inline Comments).
- **Trợ lý AI Toán học (AI Math Assistant)**:
  - **AI Question Generator**: Sinh đề bài toán học tự động theo phân loại Bloom, chủ đề, độ khó kèm cấu hình vẽ hình JSXGraph.
  - **AI Student Hints**: Gợi ý giải toán từng bước có kiểm soát dành cho học sinh.
  - **AI Automated Grading**: Hỗ trợ giáo viên chấm điểm và nhận xét bài nộp tự động.

### 📊 4. Bảng điều khiển & Thống kê (Dashboard & Analytics)
- Dashboard riêng cho Giáo viên (lớp đang dạy, bài cần chấm, yêu cầu chờ duyệt, cảnh báo học sinh có nguy cơ học kém) và Học sinh (bài tập sắp tới hạn, biểu đồ điểm số gần đây).
- Báo cáo trực quan bằng biểu đồ tương tác **Recharts**.

### 🛡 5. Trang Quản trị Toàn diện (Admin Portal - `/admin`)
- **Quản lý người dùng**: Tìm kiếm, lọc theo vai trò, khóa tài khoản có kèm lý do, mở khóa tài khoản.
- **Quản lý quyền hạn (RBAC)**: Xem danh sách quyền, gán permission cho từng role (`/admin/roles`), khôi phục quyền mặc định (Reset permissions).
- **Cấu hình AI Đa Nhà Cung Cấp (`/admin/ai-config`)**:
  - Quản lý AI Provider (OpenAI, Google Gemini, Anthropic Claude, DeepSeek, Groq, Ollama...).
  - Quản lý & xác thực API Keys (Mã hóa AES-256).
  - Định tuyến Task Routing & tinh chỉnh tham số model (Temperature, Top-P, Max tokens).
  - Quản lý System Prompts với lịch sử phiên bản (Versioning) & xem trước (Live Preview).
  - Kiểm tra kết nối AI Provider trực quan (Test Connection).
- **Quản lý Hạn ngạch & Credit (`CreditQuotaTab`)**: Quản lý cấp phát credit miễn phí hàng ngày, bảng sổ cái giao dịch (Credit Ledger phân trang server-side), điều chỉnh số dư thủ công và quản lý các gói credit.
- **Quản lý Báo cáo sự cố (`/admin/bug-reports`)**: Tiếp nhận, phân loại mức độ nghiêm trọng và xử lý các lỗi do người dùng báo cáo.
- **Nhật ký hệ thống (`/admin/logs`)**: Tra cứu System Audit Logs các hành động nhạy cảm.

### 💎 6. Hệ thống AI Credit Cá Nhân (`/credits`)
- Hiển thị số dư credit cá nhân, hạn ngạch miễn phí hàng ngày.
- Bảng lịch sử giao dịch credit (Credit Ledger) hỗ trợ phân trang Server-side.
- Danh sách các gói nạp credit cho người dùng.

### 📚 7. Thư viện bài tập Cộng đồng (Community Library)
- Tìm kiếm bài tập/phiếu bài tập công khai (`library:read`).
- Clone bài tập về kho cá nhân, chuyển đổi chế độ riêng tư/công khai (`library:clone`).

### 🐛 8. Báo cáo Sự Cố & Lỗi (Bug Report System)
- Modal báo cáo sự cố nhanh (`ReportBugModal`) cho phép chụp ảnh màn hình, gửi mô tả chi tiết lỗi từ mọi trang giao diện.

### 🔔 9. Thông báo Thời gian thực (Real-time Notifications)
- Hộp thông báo trên Header, kết nối Server-Sent Events (SSE), phân trang cuộn vô hạn, đếm chưa đọc, đánh dấu đã đọc.

---

## 🛠 Công nghệ sử dụng

| Danh mục | Công nghệ |
| :--- | :--- |
| **Core Framework** | [Next.js 16 (App Router)](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), shadcn/ui (Radix UI Primitives), Lucide Icons, Sonner (Toast), Recharts |
| **State & Data Fetching** | Redux Toolkit (chỉ auth), TanStack React Query v5 (hỗ trợ `keepPreviousData` cho server pagination), Axios |
| **Form & Validation** | React Hook Form, Formik, Yup, Zod, `@hookform/resolvers` |
| **Toán học & Editor** | MathLive, KaTeX, JSXGraph (với plugin Text & Grid/Axes control), TipTap Editor, React Markdown, Rehype/Remark |
| **Testing** | Vitest, React Testing Library, Playwright (E2E), MSW |

---

## 📁 Cấu trúc thư mục

```text
MathClass-fe/
├── app/                  # Định tuyến Next.js App Router (Route Groups)
│   ├── (auth)/           #   Login, signup, verify, forgot/reset password
│   ├── (dashboard)/      #   Home, classes, assignments, students, reports, library, credits, profile, settings
│   └── admin/            #   (auth)/login, users, roles, ai-config, bug-reports, logs, community-repo
├── components/           # UI Components
│   ├── ui/               #   Base shadcn/ui + chuyên toán (JSXGraph, KaTeX, TipTap, MathLive...)
│   ├── admin/            #   Admin sub-components & ai-config tabs
│   ├── ai/               #   AiQuestionGeneratorModal...
│   ├── assignments/      #   Publish modal, submission table/detail, comments...
│   ├── auth/             #   Form xác thực, modal 2FA, modal khóa tài khoản...
│   ├── bug-report/       #   ReportBugModal...
│   ├── credits/          #   Credit balance, ledger table, credit packages...
│   ├── layout/           #   Header, Sidebar, Footer, NotificationPopover
│   └── submission/       #   SubmissionDrawingEditor...
├── services/             # Axios API Services (22 services kết nối Backend Spring Boot)
├── hooks/                # Custom React Hooks (bọc React Query v5)
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
| **Public Routes** | `/`, `/login`, `/admin/login`, `/signup`, `/verify`, `/forgot-password`, `/reset-password` | Tất cả người dùng |
| **Protected Routes** | `/home`, `/classes`, `/assignments`, `/students`, `/reports`, `/library`, `/credits`, `/settings`, `/profile` | Yêu cầu Đăng nhập (JWT Cookie) |
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

