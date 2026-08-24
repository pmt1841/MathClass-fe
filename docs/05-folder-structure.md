# 📁 Cấu Trúc Thư Mục Chi Tiết (MathClass Frontend)

> Cập nhật dựa trên cấu trúc thực tế của repository. Gốc dự án: `MathClass-fe/`

## 1. Sơ đồ tổng quan

```text
MathClass-fe/
├── app/                        # Định tuyến (Next.js App Router)
├── components/                 # UI Components (shadcn/ui + feature components)
├── hooks/                      # Custom React Hooks (chủ yếu bọc React Query)
├── lib/                        # Tiện ích, Axios client, Redux store, editor utils
├── services/                   # Tầng gọi API (Axios Services)
├── types/                      # TypeScript interfaces & types dùng chung
├── specs/                      # Tài liệu spec tính năng & bảo mật frontend
├── docs/                       # Tài liệu hướng dẫn (overview, setup, kiến trúc...)
├── __tests__/                  # Unit & Component tests (Vitest + RTL)
├── e2e/                        # End-to-end tests (Playwright)
├── mocks/                      # MSW mock server cho tests
├── proxy.ts                    # Route guard / middleware phân quyền (Next.js 16)
├── next.config.mjs             # Cấu hình Next.js (redirects, headers, images)
├── playwright.config.ts        # Cấu hình Playwright
├── vitest.config.ts            # Cấu hình Vitest
├── eslint.config.js            # ESLint flat config
├── components.json             # Cấu hình shadcn/ui
├── tsconfig.json               # TypeScript (alias @/* → ./)
└── package.json
```

## 2. `app/` — Route Groups (Next.js App Router)

Các thư mục trong `()` là **Route Groups** — không ảnh hưởng URL.

```text
app/
├── layout.tsx                  # Root layout: GoogleOAuthProvider + QueryProvider + StoreProvider + Toaster
├── page.tsx                    # Landing page (public)
├── error.tsx                   # Global error boundary
├── not-found.tsx               # Trang 404
├── forbidden/                  # Trang 403 (truy cập trái phép)
├── globals.css                 # Global styles + Tailwind v4
├── icon.svg                    # App icon
├── (auth)/                     # ── Nhóm trang xác thực (public) ──
│   ├── layout.tsx              #   Layout chung nhóm auth
│   ├── login/                  #   Đăng nhập học sinh/giáo viên
│   ├── signup/                 #   Đăng ký tài khoản
│   ├── verify/                 #   Xác minh email (OTP/token)
│   ├── forgot-password/        #   Quên mật khẩu
│   └── reset-password/         #   Đặt lại mật khẩu
│
├── (dashboard)/                # ── Khu vực Học sinh & Giáo viên (cần đăng nhập) ──
│   ├── layout.tsx              #   Header + Sidebar + Footer + CreateClassModal
│   ├── home/                   #   Trang chủ sau đăng nhập (teacher/student dashboard)
│   ├── classes/                #   Danh sách lớp học
│   │   ├── page.tsx
│   │   └── [classCode]/        #   Chi tiết lớp: students/assignments/requests tabs
│   │       ├── page.tsx
│   │       └── student/        #   Giao diện lớp theo góc nhìn học sinh

│   ├── assignments/            #   Quản lý bài tập (Kho bài tập)
│   │   ├── page.tsx            #   Danh sách: tabs DRAFT / SINGLE / SHEET
│   │   ├── create/             #   Tạo bài tập (AssignmentForm + editor)
│   │   ├── [id]/               #   Chi tiết bài tập
│   │   │   ├── page.tsx
│   │   │   ├── edit/           #   Chỉnh sửa bài tập
│   │   │   └── submissions/    #   Danh sách bài nộp của 1 bài tập
│   │   │       └── [submissionId]/  #   Chi tiết 1 bài nộp + chấm điểm
│   │   ├── sheets/[id]/submissions/ # Bài nộp của phiếu bài tập
│   │   └── submit/             #   Học sinh nộp bài
│   ├── students/               #   (Teacher) Quản lý học sinh toàn hệ thống
│   ├── reports/                #   (Teacher) Báo cáo & thống kê (Recharts)
│   ├── library/                #   Thư viện bài tập cộng đồng (clone/share)
│   ├── credits/                #   Hệ thống AI Credit cá nhân & Sổ cái giao dịch
│   ├── profile/                #   Hồ sơ cá nhân + avatar upload
│   └── settings/               #   Cài đặt thông báo
│
└── admin/                      # ── Khu vực Quản trị (role = ADMIN) ──
    ├── (auth)/login/           #   Login & xác thực 2FA riêng cho admin
    └── (dashboard)/
        ├── layout.tsx          #   Header + Sidebar admin
        ├── users/              #   Quản lý người dùng (search, role filter, lock/unlock)
        ├── roles/              #   Quản lý permission theo role & reset permissions
        ├── ai-config/          #   Cấu hình AI providers, API keys, Task routing, Prompts, Credit Quota
        ├── bug-reports/        #   Quản lý & xử lý báo cáo lỗi từ người dùng
        ├── logs/               #   Nhật ký hệ thống (audit log)
        ├── community-repo/     #   Kho bài tập cộng đồng
        ├── profile/            #   Hồ sơ cá nhân của Quản trị viên
        └── settings/           #   Cài đặt hệ thống

> Các component dùng riêng cho một trang được đặt trong thư mục `_components/` ngay cạnh trang đó.

## 3. `components/`

```text
components/
├── ui/            # Base components shadcn/ui (~60 file: button, dialog, form, table, tabs...)
│                  #  + chuyên toán: jsxgraph-board, jsxgraph-editor-modal, latex-toolbar, tiptap,
│                  #                markdown-components, media-upload-modal, with-permission
├── auth/          # login-form, signup-form, forgot/reset-password-form, verify-email,
│                  #  admin-login-form, social-login-button, account-locked-modal, permission-revoked-modal
├── dashboard/     # create-class-modal, join-class-modal, stat-card
├── assignments/   # publish-assignment-modal, publish-sheet-modal, edit-sheet-modal,
│                  #  submission-table, submission-detail, submission-grade-form,
│                  #  sheet-submission-table, comment-sidebar, inline-comment-popover
├── ai/            # AiQuestionGeneratorModal (sinh đề bài toán tự động với LaTeX/JSXGraph)
├── credits/       # credit-balance-badge, credit-balance-card, credit-transactions-table, credit-packages-section
├── bug-report/    # ReportBugModal (modal báo cáo sự cố có chụp ảnh màn hình)
├── submission/    # SubmissionDrawingEditor (vẽ hình JSXGraph tương tác khi nộp bài)
├── admin/         # ai-config/* (ProviderTab, ApiKeyDialog, TaskRoutingTab, SystemPromptTab, CreditQuotaTab...)
├── landing/       # header, hero, features, experience, cta, footer (landing page)
├── layout/        # header, sidebar, footer, NotificationPopover
├── profile/       # ProfileForm, AvatarUpload
├── providers/     # StoreProvider (Redux + AuthInitializer), query-provider (React Query)
└── theme-provider.tsx
```

## 4. `hooks/`

| Hook | Mô tả |
| :--- | :--- |
| `useAuth` | User hiện tại, trạng thái auth, logout (Redux hoặc fallback cookie) |
| `useLogin` | Logic đăng nhập (role check, cookies, redirect, 2FA interception) |
| `useSignup` / `useGoogleAuth` / `useForgotPassword` / `useResetPassword` | Luồng xác thực khác |
| `useAssignments` / `usePublishAssignment` / `usePublishAssignmentSheet` / `useDeleteAssignment` | Dữ liệu bài tập |
| `useClassrooms` / `useCreateClass` / `useClassDetail` / `useClassStudents` / `useAddStudent` / `useRemoveStudent` | Dữ liệu lớp học |
| `useAdmin` | Admin users, logs, permissions, role permissions |
| `useLibrary` | Thư viện: search, clone, update visibility |
| `useProfile` / `useUpdateProfile` / `useUploadAvatar` | Hồ sơ cá nhân |
| `useSubmissionComments` | Nhận xét bôi đen trên bài nộp |
| `useSubmissionDrawing` | Hình vẽ JSXGraph trong bài nộp |
| `useTextEditor` / `useTextSelection` / `use-toast` / `use-mobile` / `useDebounce` | Tiện ích UI/editor |

## 5. `services/` — 22 Axios API Services

| File | Endpoint chính | Chức năng |
| :--- | :--- | :--- |
| `authService` | `/auth/*` | login, register, google, verify, 2FA setup/verify, forgot/reset password |
| `classroomService` | `/classrooms*` | CRUD lớp, học sinh (paged, online status), assignment của lớp |
| `joinRequestService` | `/classrooms/join-requests*` | Gửi & duyệt yêu cầu tham gia lớp |
| `assignmentService` | `/assignments*`, `/assignment-sheets*` | CRUD bài tập/phiếu, publish, upload ảnh, extract-text |
| `libraryService` | `/library/*` | Thư viện bài tập công khai, clone về kho |
| `submissionService` | `/submissions*` | Nộp bài, hủy nộp, chấm điểm, bình luận |
| `submissionDrawingService` | `/submissions/{id}/drawings` | Bản vẽ JSXGraph gắn liền bài nộp |
| `submissionHintsService` | `/submissions/{id}/hints` | Yêu cầu gợi ý giải toán từng bước từ AI |
| `submissionAiGradingService` | `/submissions/{id}/ai-grade` | Tự động chấm điểm bài nộp qua AI |
| `handwritingService` | `/submissions/handwriting-ocr` | Nhận diện công thức viết tay qua Canvas OCR |
| `aiQuestionService` | `/assignments/ai-generate` | Sinh đề bài toán học tự động qua AI |
| `creditService` | `/credits/*` | Số dư credit, sổ cái giao dịch (paged), danh sách gói nạp |
| `adminCreditService` | `/admin/credits/*` | Cấu hình hạn ngạch, điều chỉnh credit thủ công, CRUD gói credit |
| `aiConfigService` | `/providers*`, `/keys*`, `/tasks*` | Quản lý AI Providers, API Keys (AES-256), Task Routing |
| `aiFeatureService` | `/admin/ai/features*` | Bật/tắt các tính năng AI hệ thống |
| `systemPromptService` | `/admin/ai/prompts*` | Quản lý System Prompts & Lịch sử phiên bản |
| `bugReportService` | `/bug-reports*`, `/admin/bug-reports*` | Người dùng gửi lỗi & Admin tra cứu, xử lý |
| `dashboardService` | `/dashboard/*` | Thống kê teacher/student & cảnh báo at-risk |
| `profileService` | `/users/me*` | Hồ sơ cá nhân, upload avatar |
| `settingsService` | `/settings/notifications` | Cài đặt nhận thông báo |
| `notificationService` | `/notifications*` | Danh sách thông báo & đánh dấu đã đọc |
| `adminService` | `/admin/*` | Quản lý users, audit logs, roles/permissions |

## 6. `lib/`

| File | Mô tả |
| :--- | :--- |
| `axios.ts` | Axios instance (baseURL `/api/v1`, withCredentials) + interceptor: refresh-token queue, ACCOUNT_LOCKED, 403 permission-revoked |
| `auth-storage.ts` | Quản lý cookie/storage phiên (token, role, user_info, remember) |
| `redux/store.ts` + `features/authSlice.ts` + `hooks.ts` | Redux Toolkit: chỉ quản lý state `auth` |
| `constants/auth.ts` | AUTH_KEYS, ROLES, COOKIE_OPTIONS |
| `utils.ts` | `cn()`, parse/format ngày tháng (UTC → local, hỗ trợ mảng `LocalDateTime` của Spring) |
| `utils/error-handler.ts` | Trích xuất message lỗi từ AxiosError |
| `markdown.ts` | Sanitize schema (cho phép class math-inline/math-display) |
| `editor-utils.ts` | Markdown ↔ HTML (giữ nguyên `[IMAGE_x]`, `[SHAPE_x]`, `$$...$$`) |
| `rehype-mark-comments.ts` | Rehype plugin: bôi đen đoạn trích của nhận xét giáo viên trên bài nộp |
| `actions/README.ts` | Quy hoạch Server Actions (chưa dùng) |

## 7. `types/`

| File | Mô tả |
| :--- | :--- |
| `index.ts` | Student, ClassroomDetail, Assignment, UserResponse, AdminUser, PageResponse (Spring Data)... |
| `notification.ts` | NotificationResponse |
| `jsxgraph.d.ts` | Khai báo types cho thư viện JSXGraph |

## 8. Test & Tài liệu

```text
__tests__/        # Vitest: components (auth, dashboard, profile, assignments, ui), classes, home, lib
e2e/              # Playwright: auth.spec, classroom-flow.spec, assignment-flow.spec, profile-flow.spec
mocks/            # MSW: server.ts + handlers.ts (mock API cho test)
specs/            # Spec tính năng & security hardening
docs/             # 01-overview, 02-setup-guide, 03-frontend-guide, 04-architecture, 05-folder-structure
review/           # Tài liệu review (internal)
```

