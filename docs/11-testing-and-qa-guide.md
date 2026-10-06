# 🧪 Hướng Dẫn Kiểm Thử & Đảm Bảo Chất Lượng (Testing & QA Guide)

Dự án MathClass Frontend áp dụng chiến lược kiểm thử đa tầng từ Unit/Component Testing đến End-to-End Testing (E2E) nhằm đảm bảo sự ổn định của hệ thống trước khi triển khai.

---

## 1. Tổng Quan Chiến Lược Kiểm Thử

| Tầng kiểm thử | Công cụ | Phạm vi kiểm tra |
| :--- | :--- | :--- |
| **Type Check** | `tsc --noEmit` | Kiểm tra tính nhất quán và chặt chẽ của TypeScript types |
| **Linter & Formatting** | `eslint` | Kiểm tra quy chuẩn viết mã nguồn |
| **Component & Unit Test** | `Vitest` + `React Testing Library` | Kiểm tra logic render, event tương tác của từng component |
| **API Mocking** | `Mock Service Worker (MSW)` | Giả lập phản hồi API backend cho test mà không cần mạng thật |
| **End-to-End (E2E)** | `Playwright` | Giả lập hành vi người dùng thực tế trên trình duyệt thực |

---

## 2. Kiểm Tra Định Kỳ Trước Khi Commit (Quality Gate)

Theo quy định tại AGENTS.md, trước khi push code hoặc mở Pull Request, bắt buộc phải vượt qua các lệnh kiểm tra sau:

```bash
# 1. Kiểm tra lỗi kiểu dữ liệu TypeScript
npx tsc --noEmit

# 2. Kiểm tra linting
npm run lint

# 3. Chạy toàn bộ Unit & Component Tests
npm run test

# 4. Kiểm tra biên dịch sản phẩm
npm run build
```

---

## 3. Viết Component Test với Vitest & React Testing Library

Các file test được đặt trong thư mục `__tests__/` hoặc đồng cấp với component (`*.test.tsx`).

```tsx
// __tests__/components/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from '@/components/auth/login-form';

describe('LoginForm Component', () => {
  it('hiển thị đầy đủ ô nhập email và mật khẩu', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/mật khẩu/i)).toBeInTheDocument();
  });

  it('báo lỗi khi submit để trống form', async () => {
    render(<LoginForm />);
    const submitBtn = screen.getByRole('button', { name: /đăng nhập/i });
    fireEvent.click(submitBtn);
    expect(await screen.findByText(/vui lòng nhập email/i)).toBeInTheDocument();
  });
});
```

---

## 4. Kiểm Thử Luồng Thực Tế với Playwright (E2E Testing)

Các kịch bản E2E kiểm tra toàn bộ chu trình nghiệp vụ được tổ chức trong thư mục `e2e/`:

```bash
# Chạy toàn bộ E2E tests ở chế độ headless
npx playwright test

# Mở UI tương tác trực quan của Playwright
npx playwright test --ui

# Xem báo cáo chi tiết sau khi chạy test
npx playwright show-report
```

### Các kịch bản trọng yếu:
- `e2e/auth.spec.ts`: Đăng nhập, đăng ký, xác minh 2FA Quản trị viên.
- `e2e/classroom-flow.spec.ts`: Giáo viên tạo lớp học, cấp mã và học sinh tham gia lớp.
- `e2e/assignment-flow.spec.ts`: Giáo viên soạn bài tập Toán (KaTeX, JSXGraph), học sinh nộp bài và giáo viên chấm điểm.
