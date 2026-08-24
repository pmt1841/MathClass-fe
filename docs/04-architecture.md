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

### 2.7 Xác thực 2 bước (2FA TOTP & Backup Codes cho Admin)

- Khi Admin đăng nhập tại `/admin/login`, backend trả về `preAuthToken` kèm cờ `is2faRequired: true`.
- **Nếu chưa cài đặt (`isSetupRequired = true`):** Chuyển hướng sang màn hình thiết lập 2FA, gọi `POST /auth/2fa/setup` để hiển thị QR Code, người dùng quét app và gọi `POST /auth/2fa/setup/confirm` để lưu 8 mã dự phòng và hoàn tất đăng nhập.
- **Nếu đã kích hoạt (`isSetupRequired = false`):** Chuyển hướng sang màn hình nhập mã 6 số TOTP hoặc mã dự phòng, gọi `POST /auth/2fa/verify` để nhận cookie JWT và chuyển vào trang quản trị.

---

## 3. Phân quyền & Route Guard

### 3.1 Tầng Server — `proxy.ts` (Next.js 16 Proxy/Middleware)

- Đọc JWT từ cookie `mathclass_jwt`; nếu thiếu cookie role sẽ **decode JWT payload** để lấy role.
- Bảng quyền:

| Nhóm route | Đường dẫn | Điều kiện |
| :--- | :--- | :--- |
| Public | `/`, `/login`, `/admin/login`, `/signup`, `/verify`, `/forgot-password`, `/reset-password` | Tất cả |
| Protected | `/home`, `/classes`, `/assignments`, `/students`, `/reports`, `/library`, `/credits`, `/settings`, `/profile` | Có JWT Cookie |
| Teacher only | `/classes/create`, `/students`, `/reports` | `role = TEACHER` |
| Student only | `/assignments/submit` | `role = STUDENT` |
| Admin only | `/admin/*` (Ngoại trừ `/admin/login`) | `role = ADMIN` |

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

### 4.2 React Query v5 & Phân trang Server-side

- **Provider**: `QueryProvider` cấu hình `staleTime: 60s`, `retry: 1`.
- **Phân trang mượt mà (Keep Previous Data):** Sử dụng `placeholderData: keepPreviousData` trong `useQuery` giúp UI không bị giật lag/nhấp nháy loading khi đổi trang (`page`, `size`).
- **Quy ước query key:** `['assignments', userRole, activeTab, searchQuery, classCode, page, size]`, `['classroom-students', classCode, page, size, search]`, `['credit-ledger', page, size]`, `['admin-users', page, role, search]`.
- **Sau mutation**: gọi `queryClient.invalidateQueries({ queryKey: [...] })` để làm mới dữ liệu liên quan.
- **Khi đổi user** (userId thay đổi): `AuthInitializer` gọi `queryClient.clear()` để xóa cache cũ của tài khoản trước.

### 4.3 Axios Interceptor (`lib/axios.ts`)

| Sự kiện | Xử lý |
| :--- | :--- |
| Request (server-side) | Đọc cookie `mathclass_jwt` qua `next/headers` và gắn vào header `Cookie` |
| Response `ACCOUNT_LOCKED` | Xóa session → redirect `/login?reason=account_locked` (hiển thị `AccountLockedModal`) |
| Response `401` | Tự động refresh-token (queue + mutex), thất bại → logout |
| Response `403` | Dispatch event `permission-revoked` → hiển thị `PermissionRevokedModal` |

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
  - `[SHAPE_x|axes=true,grid=false,options...]` — hình vẽ JSXGraph.

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

### 6.4 Soạn thảo & Tương tác

| Công cụ | Vai trò |
| :--- | :--- |
| **TipTap** | Rich-text editor trong `AssignmentForm` (bảng, ảnh, link, công thức) |
| **MathLive** + **KaTeX** | Gõ & xem trước công thức LaTeX mượt mà |
| **JSXGraph** | Vẽ đồ thị hàm số & hình học tương tác (hỗ trợ thêm Textbox, bật/tắt trục và lưới) |
| **latex-toolbar** | Chèn nhanh lệnh LaTeX vào textarea (hook `useTextEditor`) |
| **Canvas OCR** | Nhận diện chữ viết tay công thức toán học (`handwritingService`) |

### 6.5 Nhận xét bôi đen (Submission Comments)

- Giáo viên bôi đen một đoạn trong bài nộp → tạo comment gắn với `quoteText` + `occurrenceIndex`.
- Khi render lại, plugin `lib/rehype-mark-comments.ts` tìm đúng đoạn text (theo vị trí xuất hiện) và bọc trong `<mark data-comment-id>`, bỏ qua các node `code/pre/katex-mathml`.
- Click `<mark>` → mở `inline-comment-popover` / `comment-sidebar`.

---

## 7. Bản đồ API Chi Tiết (22 Axios Services)

> Base URL: `{NEXT_PUBLIC_API_URL}/v1` (mặc định `http://localhost:8080/api/v1`).

### 7.1 Xác thực & Tài khoản
| Service | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| `authService.ts` | POST | `/auth/login` | Đăng nhập (trả HttpOnly cookie hoặc preAuthToken) |
| | POST | `/auth/register` | Đăng ký tài khoản |
| | POST | `/auth/google` | Đăng nhập Google OAuth |
| | GET | `/auth/verify?token=` | Xác minh email |
| | POST | `/auth/forgot-password` | Gửi email đặt lại mật khẩu |
| | POST | `/auth/reset-password` | Đặt lại mật khẩu |
| | POST | `/auth/logout` | Đăng xuất |
| | POST | `/auth/refresh-token` | Gia hạn token |
| | POST | `/auth/2fa/setup` | Khởi tạo QR Code thiết lập 2FA (Admin) |
| | POST | `/auth/2fa/setup/confirm` | Xác nhận kích hoạt 2FA và nhận 8 mã dự phòng |
| | POST | `/auth/2fa/verify` | Xác thực 2FA khi đăng nhập định kỳ |
| `profileService.ts` | GET/PUT | `/users/me` | Xem / cập nhật hồ sơ cá nhân |
| | POST | `/users/me/avatar` | Upload ảnh đại diện |

### 7.2 Lớp học & Thành viên
| Service | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| `classroomService.ts` | GET/POST | `/classrooms` | Danh sách / tạo lớp học |
| | GET/PUT/DELETE | `/classrooms/{classCode}` | Chi tiết / sửa / xóa lớp học |
| | GET | `/classrooms/{classCode}/students` | Danh sách thành viên lớp học (paged, online status) |
| | POST/DELETE | `/classrooms/{classCode}/students[/{studentId}]` | Thêm / xóa học sinh |
| | GET | `/classrooms/{classCode}/assignments` | Bài tập được giao trong lớp |
| `joinRequestService.ts` | POST | `/classrooms/join-requests` | Gửi yêu cầu gia nhập lớp |
| | GET | `/classrooms/join-requests/me` | Yêu cầu của tôi |
| | GET | `/classrooms/{classCode}/join-requests` | Yêu cầu chờ duyệt của lớp |
| | PUT | `/classrooms/join-requests/{id}` | Duyệt / từ chối yêu cầu |

### 7.3 Bài tập & Thư viện
| Service | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| `assignmentService.ts` | GET/POST | `/assignments` | Danh sách / tạo bài tập |
| | GET/PUT/DELETE | `/assignments/{id}` | Chi tiết / sửa / xóa bài tập |
| | PUT | `/assignments/{id}/publish` | Giao bài cho lớp học |
| | PATCH | `/assignments/{id}/visibility` | Đổi trạng thái PRIVATE / PUBLIC |
| | GET/POST/PUT/DELETE | `/assignment-sheets[/{id}]` | CRUD phiếu bài tập |
| | GET | `/assignment-sheets/{id}/completed-students` | Học sinh hoàn thành phiếu |
| | POST | `/assignments/images` | Upload ảnh minh họa |
| | POST | `/assignments/extract-text` | Bóc tách câu hỏi từ DOCX/PDF |
| `libraryService.ts` | GET | `/library/assignments`, `/library/assignment-sheets` | Tìm kiếm bài tập công khai |
| | POST | `/{type}/{id}/clone` | Sao chép bài tập về kho cá nhân |

### 7.4 Bài nộp, Chấm điểm & Trợ lý AI Học tập
| Service | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| `submissionService.ts` | POST/PUT | `/submissions[/{id}]` | Nộp / cập nhật bài nộp |
| | PUT | `/submissions/{id}/unsubmit` | Rút lại bài nộp trước hạn |
| | PUT | `/submissions/{id}/grade` | Giáo viên chấm điểm và nhận xét |
| | GET | `/submissions/me?assignmentId=` | Bài nộp của tôi |
| | GET/POST/DELETE | `/submissions/{id}/comments[/{commentId}]` | Nhận xét bôi đen |
| `submissionDrawingService.ts` | GET/PUT | `/submissions/{id}/drawings` | Dữ liệu bản vẽ JSXGraph gắn liền bài nộp |
| `submissionHintsService.ts` | POST | `/submissions/{id}/hints` | Yêu cầu gợi ý giải toán từng bước từ AI |
| `submissionAiGradingService.ts`| POST | `/submissions/{id}/ai-grade` | Tự động chấm điểm bài nộp qua AI |
| `handwritingService.ts` | POST | `/submissions/handwriting-ocr` | Nhận diện công thức toán viết tay (Canvas OCR) |
| `aiQuestionService.ts` | POST | `/assignments/ai-generate` | Sinh đề bài toán học tự động qua AI |

### 7.5 Quản lý AI Credit & Quota
| Service | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| `creditService.ts` | GET | `/credits/balance` | Số dư credit & hạn ngạch miễn phí hôm nay |
| | GET | `/credits/ledger` | Sổ cái lịch sử giao dịch credit (paged) |
| | GET | `/credits/packages` | Danh sách gói nạp credit |
| `adminCreditService.ts` | GET/PUT | `/admin/credits/config` | Cấu hình hạn ngạch & credit miễn phí hệ thống |
| | POST | `/admin/credits/adjust` | Admin điều chỉnh credit thủ công cho user |
| | GET/POST/PUT/DELETE | `/admin/credits/packages[/{id}]` | Quản lý các gói nạp credit |

### 7.6 Quản trị Hệ thống, AI Config & Báo cáo Lỗi
| Service | Method | Endpoint | Mô tả |
| :--- | :--- | :--- | :--- |
| `adminService.ts` | GET | `/admin/users` | Quản lý danh sách người dùng (paged, filter, search) |
| | PATCH | `/admin/users/{id}/status` | Khóa (kèm lý do) / mở khóa tài khoản |
| | GET/PUT/POST | `/admin/roles[/{role}/permissions]` | Quản lý phân quyền RBAC & reset quyền |
| | GET | `/admin/logs` | Tra cứu System Audit Logs |
| `aiConfigService.ts` | GET/POST/PUT/DELETE | `/providers[/{id}]` | Quản lý AI Providers |
| | POST | `/providers/test` | Kiểm tra kết nối AI Provider |
| | GET/POST/DELETE | `/providers/{id}/keys`, `/keys/{id}` | Quản lý & xác thực API Keys |
| | GET/PUT | `/tasks/{task}` | Định tuyến Task Routing & Model Parameters |
| `aiFeatureService.ts` | GET/PUT | `/admin/ai/features[/{featureKey}]` | Bật / tắt các tính năng AI hệ thống |
| `systemPromptService.ts`| GET/POST/PUT/DELETE | `/admin/ai/prompts[/{id}]` | Quản lý System Prompts & Lịch sử phiên bản |
| | POST | `/admin/ai/prompts/preview` | Xem trước kết quả render Prompt |
| `bugReportService.ts` | POST | `/bug-reports` | Người dùng gửi báo cáo sự cố/lỗi |
| | GET/PATCH | `/admin/bug-reports[/{id}/status]` | Admin tra cứu và cập nhật trạng thái lỗi |
| `dashboardService.ts` | GET | `/dashboard/*` | Thống kê giáo viên, học sinh, at-risk analytics |
| `notificationService.ts` | GET/PATCH | `/notifications/*` | Lịch sử thông báo & đánh dấu đã đọc |
| `settingsService.ts` | GET/PUT | `/settings/notifications` | Cấu hình nhận thông báo qua email / web |


---

## 8. Kiến Trúc Tích Hợp AI & Trải Nghiệm Người Dùng (AI Integration & UX Patterns)

### 8.1. Luồng Xử Lý Lỗi Hết Credit (HTTP 402 Payment Required)

Khi người dùng (Học sinh/Giáo viên) gọi bất kỳ tính năng AI nào mà số dư không đủ:
1. Backend trả về HTTP Status `402` với `errorCode = "INSUFFICIENT_CREDITS"`.
2. Axios interceptor hoặc `handleApiError()` nhận diện mã lỗi `402`.
3. Hệ thống hiển thị cảnh báo thân thiện và tự động mở Dialog gợi ý nạp thêm Credit (`/credits`) hoặc liên hệ Quản trị viên, không gây nhầm lẫn với lỗi mạng hay lỗi hệ thống (500).

```text
User Action (Sinh đề / Gợi ý AI)
       │
       ▼
useAiQuestion / useStudentHints
       │
       ▼
Axios Request ───► Backend Gateway (Reserve-then-Refund)
                         │
                         ├──► Đủ Credit: 200 OK ──► Render LaTeX / JSXGraph
                         │
                         └──► Hết Credit: 402 Payment Required
                                    │
                                    ▼
                         Hiển thị Modal Nạp Credit (/credits)
```

### 8.2. Trợ Lý Sinh Đề AI & Tích Hợp JSXGraph (`AiQuestionGeneratorModal.tsx`)

- Modal cho phép giáo viên nhập prompt tự nhiên, chọn khối lớp (6-12), mức độ tư duy (Nhận biết đến Vận dụng cao) và bật cờ "Tạo hình vẽ Canvas/JSXGraph".
- Khi AI trả về JSON có cấu trúc chứa `canvasData` (`points`, `segments`, `circles`):
  - Tự động parse và inject vào trình soạn thảo TipTap dưới dạng mã `[SHAPE_x|options]`.
  - Hiển thị trực tiếp đồ thị hình học trên `jsxgraph-board` để giáo viên xem trước và chỉnh sửa trực quan.

### 8.3. Bảng Điều Khiển Cấu Hình AI Quản Trị (`/admin/ai-config`)

Bao gồm 6 tab chức năng tích hợp chặt chẽ:
1. **Providers (`ProviderTab`):** Bật/tắt, thêm mới, xem danh sách model AI.
2. **API Keys (`ApiKeyDialog`):** Quản lý khóa API được che mờ, thêm mới key (mã hóa tự động).
3. **Test Connection (`TestConnectionTab`):** Kiểm tra kết nối 2 bước (List models & Latency ms prompt test).
4. **Task Routing (`TaskRoutingTab`):** Định tuyến model, chỉnh `temperature`, `max_tokens`, `cost_per_call` cho từng tác vụ.
5. **System Prompts (`SystemPromptTab` & `PromptPreviewRenderDialog`):** Soạn thảo prompt có biến `{{...}}`, xem trước bản render trực tiếp, khôi phục mặc định và quản lý lịch sử phiên bản (`SystemPromptHistoryDialog`).
6. **Credit Quota (`CreditQuotaTab`):** Cấu hình cấp credit mặc định, điều chỉnh số dư thủ công và quản lý các gói credit.

---

## 9. Chiến lược Testing

| Loại | Công cụ | Vị trí |
| :--- | :--- | :--- |
| Unit / Component | **Vitest** + React Testing Library + jsdom | `__tests__/` |
| Mock API | **MSW** (`mocks/server.ts`, `mocks/handlers.ts`) | setup trong `test/setup.ts` |
| E2E | **Playwright** (chromium, tự chạy `npm run dev`) | `e2e/` |

### 9.1 Quy ước test
- Test file đặt trong `__tests__/` theo đúng cấu trúc tương ứng (`components/`, `lib/`, `home/`, `classes/`).
- Component test render bằng RTL, mock dữ liệu qua MSW handlers.
- E2E test chạy tuần tự (`workers: 1`) vì dùng chung server + database.

### 9.2 Lệnh chạy
```bash
npm run test       # Vitest (unit/component)
npm run test:e2e   # Playwright (cần backend + dev server)
npm run lint       # ESLint
```


