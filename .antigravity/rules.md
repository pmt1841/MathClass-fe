# Project Context — MathClass-ui

## 1. Project Overview

- MathClass-ui: Giao diện người dùng (Frontend) cho nền tảng bài tập toán THPT (Trung học Phổ thông) trực tuyến.
- Mục đích: Xây dựng một giao diện web trực quan, hiện đại, mượt mà giúp học sinh và giáo viên THPT tương tác qua các bài tập môn Toán trực tuyến dễ dàng, hỗ trợ hiển thị ký hiệu toán học (LaTeX) chính xác.
- Ưu tiên: UX/UI trực quan, code sạch, dễ bảo trì và mở rộng.

## 2. Project Structure

- `app/` → Next.js App Router (chứa cấu trúc các trang: `(auth)/`, `(dashboard)/`, `globals.css`, các routes, v.v.)
- `components/` → Các React component được tổ chức theo module/feature:
  - `ui/` → Các base UI components (Shadcn UI + Radix UI)
  - `assignments/`, `auth/`, `dashboard/`, `landing/`, `layout/`, `providers/` → Các component theo chức năng
- `lib/` → Chứa cấu hình Axios API client (`axios.ts`), hàm tiện ích (`utils.ts`), 
- `services` -> logic gọi API (`api/`, `actions/`)
- `hooks/` → Các React custom hooks dùng chung
- `types/` → Các định nghĩa TypeScript interface/type dùng chung
- `public/` → Assets tĩnh (hình ảnh, icons, v.v.)

## 3. Coding Conventions & Standards

- Stack chính: React 19, Next.js 16.2.6 (App Router), TypeScript, Tailwind CSS v4, Lucide React, Radix UI.
- Quản lý State/Fetching: Axios & TanStack React Query v5.
- Quản lý Form & Validation: React Hook Form kết hợp Zod.
- Hiển thị công thức Toán: Sử dụng KaTeX (`katex`, `react-markdown`, `remark-math`, `rehype-katex`).
- Naming:
  - Component files & folders (trong components/): PascalCase (ví dụ: `AssignmentCard.tsx`).
  - Helper functions, hooks, variables: camelCase (ví dụ: `useAssignment.ts`, `formatDate.ts`).
  - Routes & App Router folders: kebab-case hoặc Next.js routing patterns (ví dụ: `[id]`, `(auth)`).
- Styles: Sử dụng class Tailwind CSS kết hợp với utility helper `cn()` (từ `lib/utils.ts` sử dụng `clsx` và `tailwind-merge`) khi ghép class động.

## 4. Architecture Patterns

- Phân chia rõ ràng giữa Server Components (mặc định) và Client Components (sử dụng `"use client"` ở dòng đầu tiên của file khi cần dùng state, hooks, event listeners).
- Tách biệt logic fetching và UI: Sử dụng React Query hooks ở components, hoặc viết hooks riêng thay vì gọi trực tiếp API trong file UI component lớn.
- Thiết kế component modular, dễ tái sử dụng, tránh lồng ghép quá sâu hoặc code quá dài.

## 5. Response Style

- Trả về code React/TypeScript/CSS hoàn chỉnh, có thể copy-paste được ngay.
- Không tự ý cài đặt thêm dependency mới ngoài `package.json` trừ khi được yêu cầu trực tiếp.
- Không tự ý thay đổi file config gốc (`tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `eslint.config.js`) trừ khi cần thiết và được yêu cầu trực tiếp.
- Review code: dùng định dạng có cấu trúc rõ ràng, tránh viết đoạn văn dài dòng không cần thiết.

## 6. Workflows & Modes

- Task phức tạp (thêm trang mới, refactor component lớn): đưa Implementation Plan trước, chờ xác nhận mới code.
- Task đơn giản (fix lỗi UI nhỏ, sửa text, tối ưu css): thực hiện trực tiếp không cần plan.
- Trước khi sửa code: đọc kỹ context từ file có liên quan để hiểu cấu trúc prop/type hiện tại.
- Sau khi code xong: nhắc chạy `npm run build` hoặc `npm run dev` để kiểm tra lỗi biên dịch, và chạy `npm run lint`, `npm run test` để verify tính đúng đắn.

## 7. Module-specific Rules

### 7.1. Authentication & Authorization Module (JWT)

- **Token Storage:** Access Token được lấy từ `localStorage`, `sessionStorage`, hoặc cookie (xem cấu hình trong `lib/axios.ts`). Refresh Token (nếu có) nên được quản lý qua HttpOnly cookie phía backend để bảo mật.

- **Axios API Client:** Bắt buộc sử dụng instance `api` được cấu hình sẵn trong `lib/axios.ts` cho mọi request gửi lên Backend để tự động đính kèm header `Authorization: Bearer <token>`. Không tự ý tạo instance Axios mới hoặc gọi Axios mặc định.
- **Route Guarding:** Các router dẫn vào trang nội bộ (ví dụ Dashboard, Classrooms) phải được bảo vệ để kiểm tra trạng thái đăng nhập. Nếu chưa login, tự động chuyển hướng về trang `/login` (hoặc landing page).

### 7.2. Form & Validation Module

- **Client-side Validation:** Mọi Form nhập liệu (Đăng ký, Đăng nhập, Tạo lớp học...) phải được validate ở client trước khi submit nhằm giảm tải cho server và tăng UX.

- **Thư viện chuẩn:** Sử dụng thống nhất `React Hook Form` kết hợp với `Zod` (hoặc `Formik` + `Yup` tùy thuộc vào module hiện tại đang được code trước đó để giữ tính đồng bộ). Không viết logic if/else thủ công để validate form.
- **Error Mapping:** Khi Backend trả về lỗi Validation (HTTP 400), cần xử lý để hiển thị thông báo lỗi tương ứng bên dưới từng ô nhập liệu (input field) của form.

### 7.3. Core Feature: Math Classroom Module (Phân hệ lớp học Toán)

- **State Management:** Sử dụng **TanStack React Query (v5)** làm state manager chính cho Server State (caching, synchronization). Đối với UI State cục bộ, sử dụng React state (`useState`/`useReducer`) hoặc React Context. Tuyệt đối không tự ý cài đặt thêm các thư viện Global State ngoài như Redux Toolkit hay Zustand trừ khi được yêu cầu cụ thể.

- **Component Isolation:** Các UI components nhỏ như Ô nhập công thức Toán, Biểu đồ đồ thị (JSXGraph), Danh sách học sinh bắt buộc phải tách thành các component riêng biệt dưới `components/` để tái sử dụng, không viết gộp vào một file trang lớn (pages/views).

### 7.4. Notification & Global Alert Module

- **Toast Notification:** Các thông báo Thành công/Thất bại khi gọi API phải được hiển thị qua hệ thống Toast tích hợp sẵn của dự án (`sonner` hoặc Shadcn Toast `useToast()`). Tuyệt đối không dùng hàm `alert()` mặc định của trình duyệt.

- **Loading States:** Mọi nút bấm thực hiện tác vụ API (ví dụ: Đăng nhập, Tạo bài tập, Nộp bài) phải hiển thị trạng thái loading (spinner/disabled) khi request đang xử lý để ngăn người dùng click nhiều lần (Spam Request).

### 7.5. Performance & Resource Optimization Module

- **Lazy Loading (Dynamic Imports):** Đối với các component giao diện lớn hoặc chứa các thư viện con nặng (như biểu đồ, markdown editor, KaTeX), ưu tiên sử dụng Next.js Dynamic Imports (`next/dynamic`) để code-split và lazy-load khi điều kiện hiển thị thực tế được xác định, nhằm giảm kích thước tải ban đầu (Initial Bundle Size).
- **Tối ưu hóa INP (Interaction to Next Paint):**
  - Tránh các tính toán nặng trực tiếp trong render loop của component.
  - Các logic lọc (filter), sắp xếp (sort), hoặc biến đổi danh sách dữ liệu liên kết trực tiếp với các state nhập liệu (Input Search, Filter Select) bắt buộc phải được bọc trong `useMemo` để ngăn chặn hiện tượng Input Lag khi gõ phím.
- **Chiến lược Caching & Fetching:**
  - Cấu hình thuộc tính `staleTime` hợp lý (từ 1 đến 5 phút) cho các truy vấn dữ liệu tổng quan, thống kê hoặc danh sách tĩnh của React Query.
  - Tránh sử dụng `staleTime: 0` mặc định cho các truy vấn không đòi hỏi dữ liệu thời gian thực (real-time) để giảm tải số lượng API request dư thừa lên máy chủ.

## 8. Session Management

Cuối mỗi session, tự động tạo summary với format:

- Đang làm gì?
- Đã làm xong gì?
- Decision đã chốt?
- Task tiếp theo là gì?
