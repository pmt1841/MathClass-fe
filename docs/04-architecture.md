# 🏗 Kiến Trúc Ứng Dụng (MathClass Frontend)

> Tài liệu mô tả kiến trúc tổng thể của frontend **MathClass** (Next.js 16 / React 19 / TypeScript).
> Đọc song song với [`05-folder-structure.md`](./05-folder-structure.md) để hiểu rõ vị trí từng file.

---

## 1. Tổng quan kiến trúc

```text
┌──────────────────────────────────────────────────────────────┐
│                        Browser (Client)                       │
│                                                               │
│  Pages / Components (app/*, components/*)                     │
│       │                                                       │
│       ▼                                                       │
│  Custom Hooks (hooks/*)  ────  React Query (Server State)     │
│       │                       Redux Toolkit (Chỉ auth)        │
│       ▼                                                       │
│  Services (services/*)  ────  Axios Instance (lib/axios.ts)   │
│                                  │                            │
│                                  │ Interceptors:              │
│                                  │  • Refresh token (queue)   │
│                                  │  • ACCOUNT_LOCKED          │
│                                  │  • 403 permission-revoked  │
│                                  ▼                            │
│  HTTP (Cookie HttpOnly: mathclass_jwt, mathclass_role)        │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
            ┌──────────────────────────────────┐
            │   Backend Spring Boot  (REST)    │
            │   http://localhost:8080/api/v1   │
            └──────────────────────────────────┘

Route Guard: proxy.ts (middleware cấp server, đọc cookie)
Permissions: PermissionGuard / RoutePermissionGuard (client)
```

**Nguyên tắc 3 lớp dữ liệu:**

| Tầng | Trách nhiệm | Ví dụ |
| :--- | :--- | :--- |
| `components/` (UI) | Render, form state, gọi hooks | `assignments-client.tsx` |
| `hooks/` | Bọc React Query, lộ `data/error/isLoading`, thao tác cache | `useAssignments.ts` |
| `services/` | Định nghĩa endpoint, kiểu request/response, gọi `api` | `assignmentService.ts` |
| `lib/axios.ts` | Singleton Axios + interceptor (token, refresh, lỗi) | — |

---

## 2. Luồng Xác thực (Authentication Flow)

### 2.1 Đăng nhập

1. `useLogin.login()` gọi `authService.login()` → `POST /auth/login`.
2. Backend gửi `Set-Cookie` chứa **JWT trong HttpOnly Cookie** (`mathclass_jwt`).
3. Client chỉ lưu **role** và **user_info** vào cookie thường:
   - `mathclass_role` — để `proxy.ts` nhận diện vai trò ngay lập tức.
   - `user_info` — JSON encode (fullName, email, avatar...).
   - `mathclass_remember=true` — nếu người dùng tích "Ghi nhớ đăng nhập".
4. Dispatch `setAuth()` vào Redux → redirect `/home` (hoặc `/admin/users` nếu là ADMIN).

### 2.2 Tự động gia hạn Token (Refresh Token)

Nằm trong **response interceptor** của `lib/axios.ts`:

- Request gặp lỗi `401` (không phải từ `/auth/login` hay `/auth/refresh-token`).
- Nếu chưa có request refresh nào đang chạy → gọi `POST /auth/refresh-token`.
- Các request khác bị **xếp hàng đợi** (`failedQueue`) chờ refresh xong rồi chạy lại.
- Cờ `isRefreshing` đóng vai trò **Mutex** đảm bảo chỉ **một** request refresh duy nhất.
- Nếu refresh thất bại → xóa session, chuyển về `/login`.

### 2.3 Khóa tài khoản (Account Locked)

- Nếu response chứa `code === 'ACCOUNT_LOCKED'` hoặc message chứa `"đã bị khóa"`:
  - Xóa toàn bộ cookie + storage phiên.
  - Gọi `POST /auth/logout` bằng axios gốc (tránh đệ quy interceptor).
  - Redirect về `/login?reason=account_locked` → hiển thị `AccountLockedModal`.

### 2.4 Phiên theo Tab (Tab Session)

- Không chọn "Ghi nhớ" → đánh dấu `auth_persistence=session` + `tab_session_active` trong `sessionStorage`.
- `authStorage.isValidSession()` trả `false` nếu mở tab mới (mất `tab_session_active`).
- `AuthInitializer` (trong `StoreProvider`) phát hiện phiên không hợp lệ → logout tự động.

### 2.5 Tự động tải Profile (AuthInitializer)

- `StoreProvider` gọi `GET /users/me` khi khởi động.
- Lặp lại mỗi **10 giây** và khi cửa sổ nhận `focus` event → đảm bảo dữ liệu vai trò/quyền luôn mới (admin khóa user sẽ bị đẩy ra ngay).
- Lắng nghe event `permission-revoked` (do axios interceptor 403 phát) → hiển thị `PermissionRevokedModal`.

### 2.6 Đăng xuất

- `useAuth().logout()` → `POST /auth/logout` → xóa cookies + `queryClient.clear()` → `dispatch(logoutSuccess())` → redirect `/`.

---

## 3. Phân quyền & Route Guard

### 3.1 Tầng Server — `proxy.ts` (Next.js 16 Proxy/Middleware)

- Đọc JWT từ cookie `mathclass_jwt`; nếu thiếu cookie role sẽ **decode JWT payload** để lấy role.
- Bảng quyền:

| Nhóm route | Đường dẫn | Điều kiện |
| :--- | :--- | :--- |
| Public | `/`, `/login`, `/admin/login`, `/signup`, `/verify` | Tất cả |
| Protected | `/home`, `/classes`, `/assignments`, `/students`, `/reports`, `/settings`, `/profile`, `/admin` | Có JWT |
| Teacher only | `/classes/create`, `/students`, `/reports` | `role = TEACHER` |
| Student only | `/assignments/submit` | `role = STUDENT` |
| Admin only | `/admin/*` (trừ `/admin/login`) | `role = ADMIN` |

- Khi user đã đăng nhập (chọn "Ghi nhớ") truy cập `/` hoặc `/login` → tự động redirect về `/home` (hoặc `/admin/users`).
- Tham số `?reason=account_locked` cho phép vào trang login để hiển thị cảnh báo.

### 3.2 Tầng Client — Components

| Component | Mục đích |
| :--- | :--- |
| `PermissionGuard` | Ẩn/khóa UI theo permission (hỗ trợ `fallback` và tooltip "không có quyền") |
| `RoutePermissionGuard` | Chặn truy cập trang theo permission; nếu thiếu → dispatch `permission-revoked` + `router.back()` |

- Permission ví dụ: `library:read`, `library:clone` (quyền được trả về trong `user.permissions`).
- Admin luôn được coi là có mọi quyền.
- Sidebar lọc menu theo `roles[]` và `permission` trong từng NavItem.

---

## 4. Tầng Data Fetching (React Query + Axios)

### 4.1 Mô hình tổng quát

```text
Component (page.tsx / _components)
        │  dùng hook
        ▼
hooks/useAssignments.ts  (useQuery / useMutation)
        │  gọi service
        ▼
services/assignmentService.ts
        │  dùng axios instance
        ▼
lib/axios.ts  (baseURL /api/v1, withCredentials: true, interceptor)
        ▼
Backend Spring Boot
```

### 4.2 React Query

- **Provider**: `QueryProvider` cấu hình `staleTime: 60s`, `retry: 1`.
- **Quy ước query key**: `['assignments', userRole, activeTab, searchQuery, classCode, page, size]`, `['classroom', classCode]`, `['admin-users', page, role, ...]`.
- **Sau mutation**: gọi `queryClient.invalidateQueries({ queryKey: [...] })` để làm mới dữ liệu liên quan (vd: `useAddStudent` invalidate `classroom-students` + `classroom` + `teacher-stats`).
- **Khi đổi user** (userId thay đổi): `AuthInitializer` gọi `queryClient.clear()` để xóa cache cũ của tài khoản trước.

### 4.3 Axios Interceptor (`lib/axios.ts`)

| Sự kiện | Xử lý |
| :--- | :--- |
| Request (server-side) | Đọc cookie `mathclass_jwt` qua `next/headers` và gắn vào header `Cookie` |
| Response `ACCOUNT_LOCKED` | Xóa session → redirect `/login?reason=account_locked` |
| Response `401` | Tự động refresh-token (queue + mutex), thất bại → logout |
| Response `403` | Dispatch event `permission-revoked` → hiển thị modal cảnh báo |

---

## 5. Redux State

- Redux Toolkit chỉ quản lý **một slice**: `auth` (`lib/redux/features/authSlice.ts`).
- State gồm: `user`, `isAuthenticated`, `isInitializing`.
- **Tất cả dữ liệu server** dùng React Query; Redux không lưu dữ liệu nghiệp vụ.
- `StoreProvider` = `<Provider store>` + `AuthInitializer`:
  - Tải `GET /users/me` khi khởi động và định kỳ 10s.
  - Kiểm tra tab session hợp lệ; xử lý `permission-revoked` event.

---

## 6. Xử lý nội dung Toán học

### 6.1 Định dạng lưu trữ

- Nội dung bài tập/bài nộp lưu dưới dạng **Markdown**.
- Công thức toán dùng **LaTeX**: inline `$...$`, display `$$...$$`.
- Tài nguyên đặc biệt dùng mã code:
  - `[IMAGE_x]` — hình ảnh tải lên (upload qua `POST /assignments/images`).
  - `[SHAPE_x|options]` — hình vẽ JSXGraph.

### 6.2 Pipeline chuyển đổi (`lib/editor-utils.ts`)

```text
Markdown → HTML:  extractMath() → extractResources() → marked.parse()
                   → restoreResources() → restoreMath()
HTML → Markdown:  extractMath() → extractResources() → Turndown (GFM)
                   → restoreResources() → restoreMath()
```

- **Mục tiêu**: không để Markdown parser phá vỡ LaTeX và mã `[IMAGE_x]`/`[SHAPE_x]`.

### 6.3 Hiển thị

- `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` + `rehype-sanitize` + `rehype-raw`.
- `lib/markdown.ts` mở rộng schema sanitize cho phép `className = math-inline / math-display`.

### 6.4 Soạn thảo

| Công cụ | Vai trò |
| :--- | :--- |
| **TipTap** | Rich-text editor trong `AssignmentForm` (bảng, ảnh, link, công thức) |
| **MathLive** + **KaTeX** | Gõ & xem trước công thức LaTeX |
| **JSXGraph** | Vẽ đồ thị hàm số / hình học tương tác (`jsxgraph-board`, `jsxgraph-editor-modal`) |
| **latex-toolbar** | Chèn nhanh lệnh LaTeX vào textarea (hook `useTextEditor`) |

### 6.5 Nhận xét bôi đen (Submission Comments)

- Giáo viên bôi đen một đoạn trong bài nộp → tạo comment gắn với `quoteText` + `occurrenceIndex`.
- Khi render lại, plugin `lib/rehype-mark-comments.ts` tìm đúng đoạn text (theo vị trí xuất hiện) và bọc trong `<mark data-comment-id>`, bỏ qua các node `code/pre/katex-mathml`.
- Click `<mark>` → mở `inline-comment-popover` / `comment-sidebar`.


---

## 7. Bản đồ API (API Endpoint Map)

> Base URL: `{NEXT_PUBLIC_API_URL}/v1` (mặc định `http://localhost:8080/api/v1`).

### 7.1 Auth — `services/authService.ts`
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| POST | `/auth/login` | Đăng nhập (set HttpOnly cookie) |
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/google` | Đăng nhập Google OAuth |
| GET | `/auth/verify?token=` | Xác minh email |
| POST | `/auth/forgot-password` | Gửi email đặt lại mật khẩu |
| POST | `/auth/reset-password` | Đặt lại mật khẩu |
| POST | `/auth/logout` | Đăng xuất |
| POST | `/auth/refresh-token` | Gia hạn token (interceptor) |
| GET | `/users/me` | Hồ sơ người dùng hiện tại |

### 7.2 Lớp học — `classroomService.ts` / `joinRequestService.ts`
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET/POST | `/classrooms` | Danh sách / tạo lớp |
| GET/PUT/DELETE | `/classrooms/{classCode}` | Chi tiết / sửa / xóa lớp |
| GET | `/classrooms/{classCode}/students` | Danh sách học sinh (paged) |
| POST/DELETE | `/classrooms/{classCode}/students[/{studentId}]` | Thêm / xóa học sinh |
| GET | `/classrooms/{classCode}/assignments` | Bài tập của lớp |
| POST | `/classrooms/join-requests` | Gửi yêu cầu tham gia |
| GET | `/classrooms/join-requests/me` | Yêu cầu của tôi |
| GET | `/classrooms/{classCode}/join-requests` | Yêu cầu chờ duyệt |
| PUT | `/classrooms/join-requests/{id}` | Duyệt / từ chối |

### 7.3 Bài tập — `assignmentService.ts`
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET/POST | `/assignments` | Danh sách / tạo bài tập |
| GET/PUT/DELETE | `/assignments/{id}` | Chi tiết / sửa / xóa |
| PUT | `/assignments/{id}/publish` | Giao bài cho lớp (targets + deadline) |
| PATCH | `/assignments/{id}/visibility` | PRIVATE / PUBLIC (thư viện) |
| GET | `/assignment-sheets` | Danh sách phiếu bài tập |
| POST/PUT/DELETE | `/assignment-sheets[/{id}]` | CRUD phiếu |
| GET | `/assignment-sheets/{id}/completed-students` | Học sinh đã hoàn thành |
| POST | `/assignments/images` | Upload ảnh (multipart) |
| POST | `/assignments/extract-text` | OCR trích xuất chữ từ ảnh |

### 7.4 Bài nộp — `submissionService.ts` / `submissionDrawingService.ts`
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| POST/PUT | `/submissions[/{id}]` | Tạo / cập nhật bài nộp |
| PUT | `/submissions/{id}/unsubmit` | Rút lại bài nộp |
| PUT | `/submissions/{id}/grade` | Chấm điểm + feedback |
| GET | `/submissions/me?assignmentId=` | Bài nộp của tôi |
| GET | `/submissions/{id}/comments` (POST/DELETE) | Nhận xét bôi đen |
| GET/PUT | `/submissions/{id}/drawings` | Hình vẽ JSXGraph trong bài |

### 7.5 Dashboard & Khác
| Service | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `dashboardService` | `/dashboard/teacher-stats`, `/dashboard/pending-submissions`, `/dashboard/student-stats`, `/dashboard/student-pending-tasks`, `/dashboard/student-graded-tasks`, `/dashboard/at-risk-students` | Thống kê & cảnh báo |
| `libraryService` | `/library/assignments`, `/library/assignment-sheets`, `/{type}/{id}/clone` | Thư viện công khai |
| `notificationService` | `/notifications`, `/notifications/unread-count`, `/notifications/read-all`, `/notifications/{id}/read` | Thông báo |
| `profileService` | `/users/me`, `/users/me/avatar` | Hồ sơ & avatar |
| `settingsService` | `/settings/notifications` | Cài đặt thông báo |
| `adminService` | `/admin/users`, `/admin/users/{id}/status`, `/admin/logs`, `/admin/roles/permissions`, `/admin/roles/{role}/permissions`, `/admin/roles/{role}/reset-permissions` | Quản trị |
| `aiConfigService` | `/providers`, `/providers/{id}/models`, `/providers/test`, `/providers/{id}/keys`, `/keys/{id}`, `/keys/{id}/verify`, `/tasks/{task}` | Cấu hình AI |

---

## 8. Chiến lược Testing

| Loại | Công cụ | Vị trí |
| :--- | :--- | :--- |
| Unit / Component | **Vitest** + React Testing Library + jsdom | `__tests__/` |
| Mock API | **MSW** (`mocks/server.ts`, `mocks/handlers.ts`) | setup trong `test/setup.ts` |
| E2E | **Playwright** (chromium, tự chạy `npm run dev`) | `e2e/` |

### 8.1 Quy ước test
- Test file đặt trong `__tests__/` theo đúng cấu trúc tương ứng (`components/`, `lib/`, `home/`, `classes/`).
- Component test render bằng RTL, mock dữ liệu qua MSW handlers.
- E2E test chạy tuần tự (`workers: 1`) vì dùng chung server + database.

### 8.2 Lệnh chạy
```bash
npm run test       # Vitest (unit/component)
npm run test:e2e   # Playwright (cần backend + dev server)
npm run lint       # ESLint
```

