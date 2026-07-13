# Hướng Dẫn Phát Triển (Frontend Guide)

## 1. Cấu trúc thư mục (Next.js App Router)

Nằm tại `MathClass-ui/`:

```
app/               # Hệ thống định tuyến chính (Next.js App Router)
 ├── (auth)/       # Các trang xác thực (login, register...) - Ngoặc đơn báo hiệu Route Group
 ├── dashboard/    # Các trang cho Giáo viên / Học sinh xem thống kê
 ├── classroom/    # Chức năng chính của lớp học, bài tập
 ├── layout.tsx    # Giao diện khung chung cho toàn bộ app
 └── page.tsx      # Trang chủ (Homepage)

components/        # React Components
 ├── ui/           # Các base UI component (Button, Input, Dialog, ...)
 └── ...

hooks/             # Custom Hooks (useAuth, useClassroom...)
lib/               # Các tiện ích (VD: cn() để gộp tailwind classes, api config)
styles/            # Global CSS styles (chứa config Tailwind)
types/             # Định nghĩa Type / Interface của TypeScript
```

## 2. Quy chuẩn Code (Coding Conventions)

### 2.1 File & Component

- Sử dụng `PascalCase` cho tên file chứa React Component (`MathBoard.tsx`).
- Sử dụng `camelCase` hoặc `kebab-case` cho các file tiện ích, hooks (`useMathData.ts`, `api-client.ts`).
- Sử dụng Functional Component và React Hooks.

### 2.2 Gọi API & Quản lý dữ liệu

- Khuyên dùng **React Query** (`@tanstack/react-query`) để fetch data (`useQuery`) và update data (`useMutation`).
- Không nên sử dụng `useEffect` chỉ để gọi API đơn thuần, hãy để React Query lo việc Caching, Loading, Error state.

### 2.3 Styling (Tailwind CSS)

- Chỉ định style trực tiếp bằng các class của Tailwind CSS.
- Khi cần viết CSS logic phức tạp hoặc điều kiện, sử dụng hàm `cn()` (từ `clsx` và `tailwind-merge`) trong file `lib/utils.ts`.

### 2.4 Xử lý Form

- Tất cả Form đều nên sử dụng thư viện **React Hook Form**.
- Validation (ràng buộc lỗi) sử dụng schema của **Zod** kết nối qua `@hookform/resolvers/zod`.

## 3. Tích hợp Toán học (Quan Trọng)

### 3.1 Hiển thị LaTeX

- Bạn phải sử dụng các components (wrapper) gọi thư viện `katex` (thường kèm với `react-markdown` và `rehype-katex`) để render đoạn text có chứa công thức toán an toàn.

### 3.2 Bảng vẽ hình (JSXGraph)

- Component chứa cấu hình và thẻ div tạo `JSXGraph` board bắt buộc phải là Client Component (thêm lệnh `"use client"` ở đầu file) do nó tương tác trực tiếp với DOM.
