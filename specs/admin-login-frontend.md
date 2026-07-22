# Đặc tả Kỹ thuật Frontend (Frontend Specification)

**Chức năng:** Trang Đăng nhập Dành riêng cho Quản trị viên (Admin Login Page)

---

## 1. Tổng quan & Mục tiêu Architecture

* **Mục tiêu**: Cung cấp trang đăng nhập độc lập tại `/admin/login` dành riêng cho vai trò Quản trị viên (Admin).
* **Đặc điểm kiến trúc**:
  * Tận dụng cơ chế **Route Groups** trong Next.js App Router: `app/admin/(auth)` cho trang đăng nhập và `app/admin/(dashboard)` cho các trang quản trị sau đăng nhập.
  * Giữ nguyên 100% các đường dẫn URL hiện có (`/admin/login`, `/admin/users`, `/admin/roles`, `/admin/logs`, `/admin/community-repo`).
  * Tái sử dụng 100% API xác thực ở backend (`/auth/login`), không tạo API mới.

---

## 2. Tech Stack & Cấu trúc Thư mục

* **Framework Chính:** React 19, Next.js 16 (App Router).
* **Ngôn ngữ:** TypeScript.
* **UI & Styling:** Tailwind CSS 4, Radix UI (Primitives), Lucide React (`ShieldCheck`, `Mail`, `Lock`, `Spinner`).
* **State Management & Data Fetching:**
  * **Auth State:** Redux Toolkit (`setAuth`).
  * **Server State / API Caching:** React Query (`@tanstack/react-query`).
  * **Form State & Validation:** React Hook Form kết hợp với Zod (`@hookform/resolvers/zod`).
* **HTTP Client:** Axios.
* **Testing:** Vitest, Playwright.

### Cấu trúc file chi tiết (`app/admin`)

```text
app/admin/
├── (auth)/
│   └── login/
│       └── page.tsx                 # Entrypoint cho /admin/login (Tích hợp Header bg-primary)
├── (dashboard)/
│   ├── layout.tsx                   # Admin Layout guard (Sidebar, Header, Footer)
│   ├── users/
│   ├── roles/
│   ├── logs/
│   └── community-repo/
components/
└── auth/
    └── admin-login-form.tsx         # Form đăng nhập đồng bộ tông màu Dashboard Header
```

---

## 3. Đặc tả Giao diện & Component Chi tiết

### 3.1. Trang Đăng nhập Admin (`app/admin/(auth)/login/page.tsx`)
* **Header đồng bộ**: Phía trên trang có thanh Header với nền `bg-primary` (màu tím xanh chủ đạo của Math Class), logo icon `Calculator` trong khối `bg-accent text-accent-foreground` và Badge "Cổng Quản trị Hệ thống" sắc đỏ (`bg-red-500 text-white`).
* **Layout Isolation & Suspense**: Không bị bao bởi Sidebar/Footer của Admin Dashboard. Đặt `AdminLoginForm` trong `Suspense` với loading spinner fallback.
* **Ambient Backdrop**: Nền giao diện chuẩn ứng dụng kết hợp ánh sáng mờ ambient nhẹ nhàng (`bg-primary/10`, `bg-accent/10`).

### 3.2. Form Đăng nhập Admin (`components/auth/admin-login-form.tsx`)
* **Header & Brand**:
  * Biểu tượng Logo Brand: Icon `Calculator` trong khối `bg-accent text-accent-foreground` cùng thương hiệu "Math Class".
  * Badge Vai trò: Badge "Quản trị viên" màu đỏ (`bg-red-500 text-white`) đồng bộ chính xác với Admin Role Badge trên `DashboardHeader`.
  * Tiêu đề: "Đăng nhập Hệ thống Quản trị".
  * Subtitle: "Nhập thông tin quản trị để truy cập Dashboard".
* **Card & Styling**:
  * Card chuẩn hệ thống: `bg-card border-border shadow-xl rounded-2xl text-card-foreground p-8`.
* **Form Fields**:
  * Email Field: Input + Icon Mail. Validator: email chuẩn, không để trống.
  * Password Field: PasswordInput (hiện/ẩn mật khẩu). Validator: không để trống.
  * Remember Me: Checkbox ghi nhớ phiên làm việc (`REMEMBERED_EMAIL`).
* **Actions**:
  * Nút "Đăng nhập Quản trị" (Primary button màu `bg-primary` chuẩn hệ thống với loading spinner).
  * **Không hiển thị**: Các nút Đăng nhập Mạng xã hội (Google, Facebook) và liên kết Đăng ký tài khoản.

---

## 4. Xử lý Logic & Bảo mật (Business Logic & Security)

### 4.1. Luồng Xác thực
1. Người dùng submit form -> Gọi `useLogin().login(credentials, rememberMe, ROLES.ADMIN)`.
2. `useLogin` gọi API `/auth/login` ở backend.
3. Kiểm tra vai trò trả về từ API response (`data.role` hoặc `data.userRole`):
   * **Nếu `role === 'ADMIN'`**:
     * Lưu thông tin vào Redux (`dispatch(setAuth)`).
     * Đặt cookie `mathclass_role=ADMIN` cho middleware `proxy.ts` nhận diện tức thì.
     * Lưu remembered email nếu Checkbox được chọn.
     * Chuyển hướng tới `/admin/users`.
   * **Nếu `role !== 'ADMIN'` (Học sinh/Giáo viên)**:
     * Gọi ngầm `api.post('/auth/logout')` để hủy session.
     * Hiển thị thông báo lỗi chung: *"Email hoặc mật khẩu không đúng. Vui lòng thử lại."*

### 4.2. Bảo mật Thông tin (Anti-Enumeration)
* Tuyệt đối không hiển thị thông báo lỗi kiểu *"Tài khoản của bạn không có quyền Admin"*. Thông báo lỗi đăng nhập phải được thống nhất chung để bảo mật thông tin tài khoản.

---

## 5. Nhật ký Quyết định Thiết kế (Decision Log)

| STT | Quyết định | Giải pháp được chọn | Lý do chọn |
| :--- | :--- | :--- | :--- |
| 1 | Đường dẫn URL | `/admin/login` | Đồng bộ toàn bộ tài nguyên quản trị dưới tiền tố `/admin/*`. |
| 2 | Phân tách Layout | Next.js Route Groups `(auth)` và `(dashboard)` | Tách sạch sẻ Auth Layout và Dashboard Layout mà không làm đổi URL. |
| 3 | Xử lý Sai Vai trò | Hủy token & Thông báo lỗi chung | Bảo mật ẩn thông tin tài khoản (Chống User/Role Enumeration attack). |
| 4 | Phong cách UI | Đồng bộ Tông màu với Dashboard Header | Tái sử dụng màu `bg-primary`, logo `Calculator` khối `bg-accent` và badge Admin `bg-red-500 text-white` tạo tính nhất quán nhận diện thương hiệu Math Class. |

---

## 6. Kịch bản Kiểm thử & Nghiệm thu (Acceptance Criteria)

1. **AC-1 (Admin Login Success)**: Đăng nhập bằng tài khoản `ADMIN` tại `/admin/login` -> Đăng nhập thành công, Redux auth & cookie `mathclass_role` được cập nhật, chuyển hướng đến `/admin/users`.
2. **AC-2 (Non-Admin Access Denied)**: Đăng nhập bằng tài khoản `STUDENT` hoặc `TEACHER` tại `/admin/login` -> Báo lỗi *"Email hoặc mật khẩu không đúng"*, không chuyển hướng, token bị hủy.
3. **AC-3 (Layout & Brand Consistency)**: Trang `/admin/login` hiển thị thanh Header đồng bộ màu `bg-primary`, logo `Calculator`, role badge `bg-red-500` và Card form màu chuẩn hệ thống Math Class.
4. **AC-4 (Dashboard Navigation Guard)**: Đã đăng nhập Admin tại `/admin/login` -> Truy cập `/admin/users`, `/admin/roles`, `/admin/logs` bình thường với đầy đủ Sidebar/Header Admin.
