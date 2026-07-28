# Frontend AI Agent Guidelines (MathClass-ui)

Tập tin này định nghĩa quy tắc hoạt động, thứ tự nạp ngữ cảnh và quy chuẩn phát triển dành cho AI Agent khi làm việc trong dự án **MathClass-ui**.

---

## 1. Context Loading Order (Thứ tự nạp Ngữ cảnh)

Trước khi thực hiện bất kỳ nhiệm vụ nào (tạo trang mới, sửa UI, refactor component, bắt lỗi), AI **BẮT BUỘC** phải nạp ngữ cảnh theo thứ tự sau:

1. 📖 **Tổng quan giao diện & Router:** Đọc [README.md](../README.md) để nắm cấu trúc App Router và các luồng giao diện chính.
2. 🔴 **Quy chuẩn kỹ thuật BẮT BUỘC:** Đọc [.antigravity/rules.md](../.antigravity/rules.md) chứa toàn bộ quy định về Server/Client Components, Tailwind CSS, TypeScript types và Axios Client.

---

## 2. Tech Stack & Môi trường Phát triển

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS v4, Radix UI, Shadcn UI (`components/ui/`), Lucide React
- **State & Fetching:** Axios, TanStack React Query v5
- **Form & Validation:** React Hook Form kết hợp Zod schema
- **LaTeX Math Rendering:** KaTeX (`katex`, `react-markdown`, `remark-math`, `rehype-katex`)

---

## 3. Skill Trigger Rules (Tự Động Kích Hoạt Skill)

AI cần tự động áp dụng các skill sau theo đúng loại tác vụ:

- **Khi thảo luận, làm rõ ý tưởng, UI layout hoặc UX workflow mới trước khi code:** ➔ Sử dụng skill [brainstorming](skills/brainstorming/SKILL.md)
- **Khi Refactor, tối ưu hóa code component, custom hook hoặc util chưa sạch:** ➔ Sử dụng skill [clean-code](skills/clean-code/SKILL.md)
- **Khi đánh giá, review Frontend code hoặc kiểm tra chất lượng Pull Request:** ➔ Sử dụng skill [code-reviewer](skills/code-reviewer/SKILL.md)
- **Khi tạo/sửa UI Component, Layout, Page Next.js:** ➔ Sử dụng skill [senior-frontend](skills/senior-frontend/SKILL.md)
- **Khi xử lý Routing, Server Actions, Server Components:** ➔ Sử dụng skill [nextjs-best-practices](skills/nextjs-best-practices/SKILL.md)
- **Khi định nghĩa Type/Interface phức tạp, xử lý Generics hoặc Type safety:** ➔ Sử dụng skill [typescript-pro](skills/typescript-pro/SKILL.md)
- **Khi làm việc với End-to-End Test (E2E) hoặc Playwright Automation:** ➔ Sử dụng skill [e2e-testing-patterns](skills/e2e-testing-patterns/SKILL.md) hoặc [playwright-skill](skills/playwright-skill/SKILL.md)
- **Khi viết kịch bản test giao diện web app thực tế (UI Testing):** ➔ Sử dụng skill [webapp-testing](skills/webapp-testing/SKILL.md)
- **Khi viết Unit Test / Component Test:** ➔ Sử dụng skill [unit-testing-test-generate](skills/unit-testing-test-generate/SKILL.md)

---

## 4. Nguyên Tắc Kiến Trúc & Coding Standards

- **Server Component First:** Mặc định mọi component trong `app/` đều là **React Server Components (RSC)**. Chỉ thêm chỉ dẫn `'use client'` ở dòng đầu tiên của file khi thực sự cần dùng state (`useState`), hooks (`useEffect`), event listeners (`onClick`), hoặc browser APIs.
- **Axios Client Centralization:** Bắt buộc sử dụng Axios instance đã được cấu hình sẵn tại `@/lib/axios` cho mọi yêu cầu gửi lên Backend. **Không tự ý gọi `axios.get` mặc định hoặc tạo instance mới**.
- **Styling Standards:** Toàn bộ UI phải sử dụng Tailwind CSS classes. Sử dụng helper `cn()` (từ `@/lib/utils`) khi ghép chuỗi class động. **Không dùng inline styles (`style={{...}}`)**.
- **Naming Conventions:**
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
> - **Tên nhánh:** Ưu tiên sử dụng mã **Main Task / Story / Bug ID** (để quản lý theo tính năng hoặc lỗi tổng thể).
> - **Commit Message:** Ưu tiên sử dụng mã **Sub-task / Sub-bug ID** (nếu task/bug được chia nhỏ thành Sub-task trên Jira), hoặc mã **Main Task / Bug ID** (nếu làm việc trực tiếp trên Ticket chính).

### 🌿 Quy tắc đặt tên nhánh (Branch Naming):
Cấu trúc bắt buộc: `<type>/<mã-task-jira>/<tên-tính-năng>` (tên tính năng dùng `kebab-case`).
- `feature/<mã-task-jira>/<tên-tính-năng>` : Phát triển tính năng mới (ví dụ: `feature/MAT-101/assignment-submission-ui`)
- `fix/<mã-task-jira>/<tên-lỗi>` : Sửa lỗi / Bugfix (ví dụ: `fix/MAT-205/katex-rendering-issue`)
- `refactor/<mã-task-jira>/<tên-mô-tả>` : Tối ưu hóa, cấu trúc lại component (ví dụ: `refactor/MAT-302/navbar-component`)
- `test/<mã-task-jira>/<tên-mô-tả>` : Bổ sung kiểm thử / E2E test suite (ví dụ: `test/MAT-401/playwright-e2e-flow`)
- `chore/<mã-task-jira>/<tên-mô-tả>` : Cấu hình dependencies, Next.js, Tailwind (ví dụ: `chore/MAT-500/update-tailwind`)

### 💬 Quy tắc Commit Message (Conventional Commits):
Cấu trúc: `<type>(<mã-task-jira>): <nội dung mô tả ngắn gọn>`
- `feat(MAT-101): xây dựng giao diện nộp bài tập tự luận`
- `fix(MAT-205): khắc phục lỗi hiển thị công thức toán KaTeX`
- `refactor(MAT-302): tối ưu hóa component Navbar sử dụng Server Component`
- `test(MAT-401): bổ sung E2E test cho luồng giao bài tập`
- `docs(MAT-500): cập nhật quy chuẩn Git Branch và Commit vào AGENTS.md`
- `chore(MAT-600): cập nhật cấu hình Tailwind CSS v4`
