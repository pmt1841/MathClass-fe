# Frontend AI Agent Guidelines (MathClass-fe)

Tập tin này định nghĩa quy tắc hoạt động, thứ tự nạp ngữ cảnh và quy chuẩn phát triển dành cho AI Agent khi làm việc trong dự án **MathClass-fe**.

---

## 1. Context Loading Order (Thứ tự nạp Ngữ cảnh)

Trước khi thực hiện bất kỳ nhiệm vụ nào (tạo trang mới, sửa UI, refactor component, bắt lỗi), AI **BẮT BUỘC** phải nạp ngữ cảnh theo thứ tự sau:

1. 📖 **Tổng quan giao diện & Router:** Đọc [README.md](../README.md) để nắm cấu trúc App Router và các luồng giao diện chính.
2. 🔴 **Quy chuẩn kỹ thuật BẮT BUỘC:** Đọc [.antigravity/rules.md](../.antigravity/rules.md) chứa toàn bộ quy định về Server/Client Components, Tailwind CSS, TypeScript types và Axios Client.

---

## 2. Tech Stack & Môi trường Phát triển

Chi tiết danh sách Tech Stack và thư viện được quản lý tập trung tại [README.md](../README.md) và [.antigravity/rules.md](../.antigravity/rules.md).

---

## 3. Skill Trigger Rules (Quy chuẩn kích hoạt Skill theo Vòng đời SDLC)

AI **BẮT BUỘC** phải đối chiếu và kích hoạt skill theo đúng thứ tự các bước trong vòng đời phát triển giao diện:

1. 💡 **Lên ý tưởng & Thiết kế UX/UI (Khởi tạo):**
   - Khi thảo luận tính năng mới, làm rõ UI layout, wireframe, hoặc flow người dùng: ➔ Bắt buộc kích hoạt [brainstorming](skills/brainstorming/SKILL.md)

2. 📐 **Định nghĩa Kiểu dữ liệu & API Contract (Type Safety Phase):**
   - Khi định nghĩa Type/Interface, DTO mapping, Generics hoặc xử lý Type phức tạp: ➔ Bắt buộc kích hoạt [typescript-pro](skills/typescript-pro/SKILL.md)

3. ⚛️ **Xây dựng Giao diện & Component (Frontend Development):**
   - Khi tạo/sửa UI Component, Layout, xử lý responsive, Tailwind CSS: ➔ Bắt buộc áp dụng [senior-frontend](skills/senior-frontend/SKILL.md)
   - Khi xử lý Routing, Server Components (RSC), Client Components, Server Actions: ➔ Kích hoạt [nextjs-best-practices](skills/nextjs-best-practices/SKILL.md)
   - Khi Refactor code component, custom hook hoặc util để tối ưu độ sạch: ➔ Kích hoạt [clean-code](skills/clean-code/SKILL.md)

4. 🧪 **Kiểm thử Giao diện & Chức năng (Verification Phase):**
   - Khi viết Unit Test / Component Test (Jest/Vitest/React Testing Library): ➔ Kích hoạt [unit-testing-test-generate](skills/unit-testing-test-generate/SKILL.md)
   - Khi viết kịch bản test giao diện web app thực tế (UI Testing): ➔ Kích hoạt [webapp-testing](skills/webapp-testing/SKILL.md)
   - Khi viết End-to-End Test (E2E) hoặc tự động hóa Playwright: ➔ Kích hoạt [e2e-testing-patterns](skills/e2e-testing-patterns/SKILL.md) hoặc [playwright-skill](skills/playwright-skill/SKILL.md)

5. 🔍 **Đánh giá & Review (Quality Gate):**
   - Khi hoàn thành tính năng, trước khi commit hoặc review Pull Request: ➔ Bắt buộc kích hoạt [code-reviewer](skills/code-reviewer/SKILL.md)

---

## 4. Nguyên Tắc Kiến Trúc & Coding Standards

- **Server Component First:** Mặc định mọi component trong `app/` đều là **React Server Components (RSC)**. Chỉ thêm chỉ dẫn `'use client'` ở dòng đầu tiên của file khi thực sự cần dùng state (`useState`), hooks (`useEffect`), event listeners (`onClick`), hoặc browser APIs.
- **Axios Client Centralization:** Bắt buộc sử dụng Axios instance đã được cấu hình sẵn tại `@/lib/axios` cho mọi yêu cầu gửi lên Backend. **Không tự ý gọi `axios.get` mặc định hoặc tạo instance mới**.
- **Styling Standards:** Toàn bộ UI phải sử dụng Tailwind CSS classes. Sử dụng helper `cn()` (từ `@/lib/utils`) khi ghép chuỗi class động. **Không dùng inline styles (`style={{...}}`)**.
- **Type & Interface Naming Conventions:**
  - **Dữ liệu gửi lên Backend (Request):** Bắt buộc sử dụng hậu tố `*Request` (ví dụ: `CreateAssignmentRequest`, `LoginRequest`, `UpdateProfileRequest`).
  - **Dữ liệu nhận về từ Backend (Response):** Bắt buộc sử dụng hậu tố `*Response` cho các model phản hồi từ API (ví dụ: `UserResponse`, `AssignmentResponse`, `ClassroomResponse`).
  - **Tuyệt đối KHÔNG** sử dụng hậu tố `*Dto` (như `AssignmentDto`, `UserDto`) trong TypeScript interface/type.
- **File & Folder Naming Conventions:**
  - Component files & folders (trong `components/`): `PascalCase.tsx` (ví dụ: `AssignmentCard.tsx`).
  - Hooks, utils, services: `camelCase.ts` (ví dụ: `useAssignment.ts`, `formatDate.ts`).
  - App Router folders: `kebab-case` hoặc theo chuẩn Next.js (ví dụ: `(dashboard)`, `[id]`).

---

## 5. Verification Checklist (Kiểm tra bắt buộc)

Sau khi tạo hoặc chỉnh sửa code, AI **BẮT BUỘC** phải hỗ trợ kiểm tra lỗi biên dịch và kiểu dữ liệu:

```bash
# Kiểm tra TypeScript typecheck không bị lỗi
npx tsc --noEmit

# Kiểm tra Linter
npm run lint

# Kiểm tra Build sản phẩm
npm run build
```

---

## 6. Git Branch & Commit Conventions (Quy chuẩn Git & Commit)

Khi người dùng yêu cầu AI tạo nhánh, tạo commit hoặc push code lên GitHub, AI **BẮT BUỘC** phải tuân thủ các quy tắc sau:

> 💡 **Ghi chú về `<mã-task-jira>`:**
>
> - **Tên nhánh:** Ưu tiên sử dụng mã **Main Task / Story / Bug ID** (để quản lý theo tính năng hoặc lỗi tổng thể).
> - **Commit Message:** Ưu tiên sử dụng mã **Sub-task / Sub-bug ID** (nếu task/bug được chia nhỏ thành Sub-task trên Jira), hoặc mã **Main Task / Bug ID** (nếu làm việc trực tiếp trên Ticket chính).

### 🌿 Quy tắc đặt tên nhánh (Branch Naming)

Cấu trúc bắt buộc: `<type>/<mã-task-jira>/<tên-tính-năng>` (tên tính năng dùng `kebab-case`).

- `feature/<mã-task-jira>/<tên-tính-năng>` : Phát triển tính năng mới (ví dụ: `feature/MAT-101/assignment-submission-ui`)
- `bugfix/<mã-task-jira>/<tên-lỗi>` : Sửa lỗi / Bugfix (ví dụ: `fix/MAT-205/katex-rendering-issue`)
- `refactor/<mã-task-jira>/<tên-mô-tả>` : Tối ưu hóa, cấu trúc lại component (ví dụ: `refactor/MAT-302/navbar-component`)
- `test/<mã-task-jira>/<tên-mô-tả>` : Bổ sung kiểm thử / E2E test suite (ví dụ: `test/MAT-401/playwright-e2e-flow`)
- `chore/<mã-task-jira>/<tên-mô-tả>` : Cấu hình dependencies, Next.js, Tailwind (ví dụ: `chore/MAT-500/update-tailwind`)

### 💬 Quy tắc Commit Message (Conventional Commits)

Cấu trúc: `<type>(<mã-task-jira>): <nội dung mô tả ngắn gọn>`

- `feat(MAT-101): xây dựng giao diện nộp bài tập tự luận`
- `fix(MAT-205): khắc phục lỗi hiển thị công thức toán KaTeX`
- `refactor(MAT-302): tối ưu hóa component Navbar sử dụng Server Component`
- `test(MAT-401): bổ sung E2E test cho luồng giao bài tập`
- `docs(MAT-500): cập nhật quy chuẩn Git Branch và Commit vào AGENTS.md`
- `chore(MAT-600): cập nhật cấu hình Tailwind CSS v4`
