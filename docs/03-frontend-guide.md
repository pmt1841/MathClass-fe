# Hướng Dẫn Phát Triển (Frontend Guide)

> Quy chuẩn code & hướng dẫn phát triển cho frontend **MathClass**. Đọc cùng [`04-architecture.md`](./04-architecture.md) để hiểu kiến trúc.

## 1. Cấu trúc thư mục (Next.js App Router)

```text
app/
 ├── (auth)/           # Trang xác thực (login, signup, verify, forgot/reset password)
 ├── (dashboard)/      # Khu vực Học sinh & Giáo viên (home, classes, assignments, library...)
 ├── admin/            # Khu vực Quản trị (users, roles, ai-config, logs, community-repo)
 ├── layout.tsx        # Root layout (providers: GoogleOAuth + React Query + Redux)
 └── page.tsx          # Landing page (public)

components/            # UI Components
 ├── ui/               # Base components shadcn/ui + chuyên toán (JSXGraph, KaTeX, TipTap...)
 └── <feature>/        # Component theo tính năng (auth, assignments, dashboard, admin...)

services/              # Tầng gọi API (Axios Services) — 1 file / 1 domain
hooks/                 # Custom hooks (bọc React Query)
lib/                   # axios instance, auth-storage, Redux store, editor utils
types/                 # TypeScript types dùng chung
__tests__/             # Unit & Component tests (Vitest)
e2e/                   # End-to-end tests (Playwright)
specs/                 # Spec tính năng & bảo mật
docs/                  # Tài liệu kỹ thuật
```

> Thư mục con dùng ngoặc tròn `(auth)`, `(dashboard)` là **Route Groups** — không xuất hiện trên URL, dùng để nhóm layout chung.

## 2. Quy chuẩn Code (Coding Conventions)

### 2.1 Đặt tên file & component

| Loại | Quy tắc | Ví dụ |
| :--- | :--- | :--- |
| React Component | `PascalCase.tsx` | `AssignmentForm.tsx`, `SaveRolePermissionsModal.tsx` |
| Hook | `useCamelCase.ts` | `useAssignments.ts` |
| Service | `camelCaseService.ts` | `assignmentService.ts` |
| Tiện ích | `kebab-case.ts` | `date-utils.ts`, `error-handler.ts` |
| Component nội bộ trang | đặt trong `_components/` cạnh trang | `app/(dashboard)/assignments/_components/` |

- Luôn dùng **Functional Component** + Hooks.
- File client component phải khai báo `'use client'` ở dòng đầu.

### 2.2 Gọi API & Quản lý dữ liệu (Bắt buộc theo mô hình 3 lớp)

```
Component → Hook (React Query) → Service (Axios) → Backend
```

- **Component** không được gọi `api` trực tiếp — chỉ gọi hook.
- **Hook** bọc `useQuery` / `useMutation`, trả về `data / isLoading / error` và các hàm thao tác.
- **Service** định nghĩa endpoint, interface request/response, gọi instance `api` từ `@/lib/axios`.
- **Phân trang Server-side với TanStack Query v5 (`MAT-341`):**
  - Luôn sử dụng `placeholderData: keepPreviousData` trong `useQuery` để giữ dữ liệu trang trước đó mượt mà khi chuyển trang (`page`, `size`).
  - Cấu trúc Query Key đồng bộ: `['domain', page, size, searchQuery, filterParams]`.
- Sau mutation thành công, gọi `queryClient.invalidateQueries(...)` để làm mới dữ liệu liên quan.
- **Không** dùng `useEffect` để fetch data — để React Query lo cache/loading/error.
- Các lỗi API được hiển thị qua `sonner` toast hoặc `handleApiError()`.

### 2.3 Form, Validation & Dialogs

- Ưu tiên **React Hook Form** + schema **Zod** (`@hookform/resolvers/zod`), hoặc **Formik** đối với các modal form nghiệp vụ phức tạp.
- Dùng component `Form` / `Field` trong `components/ui` đã wrap sẵn RHF.
- Form submit gọi mutation của React Query, hiển thị trạng thái loading qua `isPending` / `isSubmitting`.
- Các modal/dialog độc lập (như `ReportBugModal`, `AiQuestionGeneratorModal`, `ApiKeyDialog`) phải quản lý state đóng/mở rõ ràng, tự động reset form khi đóng dialog và hủy mutation nếu người dùng hủy thao tác.

### 2.4 Styling (Tailwind CSS v4)

- Style trực tiếp bằng class Tailwind; gộp class điều kiện bằng `cn()` (`lib/utils.ts`).
- Tận dụng `components/ui` (shadcn) — **không** tự viết lại base component đã có.
- Chỉnh theme qua CSS variables trong `app/globals.css`.

### 2.5 Types

- Type dùng chung đặt trong `types/` (Student, Assignment, PageResponse...).
- Type riêng của 1 domain đặt ngay tại file service tương ứng (vd: `AssignmentResponse` trong `assignmentService.ts`).
- Khi đổi kiểu dữ liệu backend, cập nhật type trước khi sửa component.

### 2.6 State

- **Server state** → React Query (không lưu trong Redux).
- **Client global state** → chỉ có `auth` (Redux Toolkit, `lib/redux/features/authSlice.ts`).
- Đọc auth qua `useAuth()`; dispatch qua `useAppDispatch` từ `@/lib/redux/hooks`.

### 2.7 Ngày giờ & Trạng thái Realtime

- Dùng helpers trong `lib/utils.ts`: `parseDateSafe()`, `formatDate()`, `formatDateTime()`, `formatDistanceToNowSafe()`.
- **Lưu ý**: Backend trả UTC (chuỗi hoặc mảng `LocalDateTime`); các helper đã xử lý chuyển đổi, không dùng `new Date()` trực tiếp.
- **Trạng thái Online 5 phút (`MAT-336`):** Đối với danh sách bạn cùng lớp, kiểm tra trường `isOnline` và kết hợp `AvatarFallback` tránh vỡ giao diện khi người dùng chưa có avatar.

### 2.8 Tích Hợp AI Hooks & Xử Lý Lỗi Hết Credit (HTTP 402)

- **Các Hooks AI chuyên biệt:**
  - `useAiQuestionGenerator`: Quản lý mutation sinh câu hỏi, nhận diện DTO có chứa `canvasData` để tự động render lên JSXGraph.
  - `useStudentHints`: Quản lý luồng xin gợi ý tư duy, tự động vô hiệu hóa nút bấm khi đạt giới hạn 3 lần/bài tập.
  - `useCreditBalance` & `useCreditLedger`: Lấy số dư và lịch sử giao dịch credit cá nhân (hỗ trợ phân trang `keepPreviousData`).
- **Xử lý Mã Lỗi `402 Payment Required`:**
  - Khi bắt được lỗi `402` hoặc `errorCode === 'INSUFFICIENT_CREDITS'`, component bắt buộc hiển thị toast thông báo hoặc mở modal CTA điều hướng người dùng tới trang nạp credit (`/credits`).
  - Tuyệt đối không hiển thị thông báo chung chung "Lỗi hệ thống 500" khi người dùng hết credit.

## 3. Tích hợp Toán học & Trợ Lý AI (Quan Trọng)

### 3.1 Hiển thị LaTeX

- Dùng `react-markdown` + `remark-math` + `rehype-katex` + `rehype-sanitize` (xem `lib/markdown.ts`).
- Không render HTML lạ trực tiếp — luôn qua sanitize.

### 3.2 Vẽ hình JSXGraph Nâng Cao & Tích Hợp AI

- Dùng `jsxgraph-board` / `jsxgraph-editor-modal` trong `components/ui`.
- File JSXGraph phải là **Client Component** (`'use client'`) vì thao tác trực tiếp DOM.
- **Các tính năng vẽ nâng cao:**
  - Chèn Textbox/Nhãn vào bản vẽ (`MAT-326`).
  - Bật/tắt độc lập Hệ trục tọa độ (Axes) và Lưới ô vuông (Grid) (`MAT-327`).
  - Tự động vẽ các hình học AI sinh ra từ `AiQuestionGeneratorModal` qua cấu trúc `canvasData` (`points`, `segments`, `circles`).
- Dữ liệu hình vẽ lưu dạng mã `[SHAPE_x|axes=true,grid=false,options...]` trong nội dung Markdown.

### 3.3 Editor & Chuyển đổi nội dung

- Soạn thảo: **TipTap** (rich text), MathLive LaTeX input, hoặc textarea + **latex-toolbar**.
- Chuyển đổi Markdown ↔ HTML: chỉ dùng `lib/editor-utils.ts` (`markdownToHtml` / `htmlToMarkdown`) để không làm hỏng `$$...$$` và mã `[IMAGE_x]` / `[SHAPE_x]`.


## 4. Nhận xét bôi đen (Submission Comments)

- Comment gắn với `quoteText` + `occurrenceIndex` để định vị lại đoạn text.
- Khi render, dùng plugin `lib/rehype-mark-comments.ts` (không sửa file này trừ khi thật sự cần — logic tinh tế về vị trí text node).

## 5. Quy trình làm việc

- Nhánh theo quy tắc: `feature/MAT-xxx/short-description`, `bugfix/MAT-xxx/...`, `fix/MAT-xxx/...`, `docs/...`.
- Commit message theo chuẩn Conventional Commits, có kèm mã ticket:
  - `feat(MAT-285): ...`
  - `fix(MAT-301): ...`
  - `docs(...)`, `refactor(...)`, `test(...)`, `chore(...)`.
- Trước khi tạo PR: chạy `npm run lint`, `npm run test`, đảm bảo build thành công (`npm run build`).
- Spec tính năng đặt trong `specs/`; cập nhật `docs/` khi thay đổi kiến trúc.

