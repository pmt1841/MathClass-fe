# Tổng Quan Dự Án MathClass (Frontend)

Chào mừng bạn đến với module Frontend của dự án **MathClass** - Hệ thống LMS đặc tả dành riêng cho Toán học.

## 1. Mục tiêu

- Cung cấp giao diện trực quan, tương tác cao cho Giáo viên và Học sinh.
- Hỗ trợ nhập và hiển thị công thức Toán (KaTeX, MathLive).
- Tích hợp công cụ vẽ hình học/đồ thị (JSXGraph).

## 2. Kiến trúc & Công nghệ (Architecture & Tech Stack)

- **Framework Chính:** React 19, Next.js 16 (App Router).
- **Ngôn ngữ:** TypeScript.
- **UI/Styling:** Tailwind CSS 4, Radix UI (Primitives), Lucide React (Icons).
- **State & Data Fetching:** React Query (cho Server state), React Hook Form (cho form state).
- **Validation:** Zod.
- **Testing:** Vitest, Playwright.

## 3. Các tài liệu quan trọng

Để bắt tay vào code, bạn hãy đọc tuần tự các tài liệu sau:

1. [Hướng dẫn Cài đặt Môi trường (Setup Guide)](02-setup-guide.md)
2. [Quy chuẩn và Hướng dẫn Code (Frontend Guide)](03-frontend-guide.md)
3. [Kiến trúc Ứng dụng (Architecture)](04-architecture.md)
4. [Cấu trúc Thư mục Chi tiết (Folder Structure)](05-folder-structure.md)
