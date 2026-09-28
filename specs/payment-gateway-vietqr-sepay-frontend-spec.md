# Spec: Giao diện Nạp Credit Quét mã VietQR & Quản lý Cấu hình Thanh toán Admin (`MathClass-fe`)

---

## 1. Feature Overview & Core Objectives
Tính năng này xây dựng trải nghiệm thanh toán nạp credit trực quan cho người dùng và giao diện quản trị cấu hình ngân hàng trong hệ thống `MathClass-fe`.
* **Mã task Jira:** [MAT-361](https://phanvanluan611996.atlassian.net/browse/MAT-361)
* **Quy trình nạp Credit quét mã VietQR tự động (User Flow):**
  * Thay thế nút nạp giả lập bằng Modal thanh toán VietQR động (`PaymentQrModal.tsx`).
  * Khi chọn gói credit, hệ thống hiển thị:
    - Mã VietQR chuẩn Napas247 (tích hợp sẵn số tài khoản, số tiền và nội dung đơn dạng `MAT<orderId>`).
    - Các nút sao chép nhanh 1-chạm (One-click Copy) cho Số tài khoản, Số tiền, và Nội dung chuyển tiền kèm phản hồi trực quan (tooltip / check icon).
    - Đồng hồ đếm ngược thời gian thanh toán (15 phút).
    - Cơ chế kiểm tra trạng thái tự động (Live Polling mỗi 2.5s): Ngay khi SePay Webhook báo tiền đã vào, modal tự động chuyển sang trạng thái "Thanh toán thành công" kèm số credit được cộng và cập nhật số dư ngay trên Header/Profile mà không cần F5.
* **Giao diện Quản lý Cấu hình Thanh toán bên Admin (Admin Flow):**
  * Bổ sung Tab "Cấu hình Thanh toán & VietQR" trong trang `/admin/ai-config` hoặc trang quản trị thanh toán.
  * Cho phép Admin cấu hình:
    - Ngân hàng nhận tiền (Mã ngân hàng / Bank Code: MB, VCB, ICB, TCB, ACB, VPB, ...).
    - Số tài khoản & Tên chủ tài khoản thụ hưởng.
    - API Key bí mật kết nối Webhook SePay (ẩn/hiện mật khẩu).
    - Tiền tố nội dung chuyển tiền (mặc định: `MAT`).
    - Nút bật/tắt trạng thái cổng thanh toán VietQR.
* **Giao diện Quản lý Lịch sử Đơn nạp Credit dành cho Admin:**
  * Bảng theo dõi các đơn mua credit (`Credit Orders`) với bộ lọc trạng thái (Tất cả, Đang chờ, Thành công, Thất bại).
  * Hiển thị đầy đủ thông tin: Mã đơn, Khách hàng (Tên/Email), Gói credit, Số tiền, Mã giao dịch ngân hàng, Thời gian tạo/thanh toán.
  * Nút "Duyệt thủ công" có hộp thoại xác nhận (Confirm Dialog) để hỗ trợ cộng credit bù khi người dùng chuyển khoản sai cú pháp nội dung.

---

## 2. Tech Stack & Coding Standards
* **Framework:** Next.js 14+ (App Router, Client Components với `'use client'`).
* **Language:** TypeScript 5+ (Strict Type Checking, không dùng `any`).
* **Styling:** Tailwind CSS, `cn()` utility từ `@/lib/utils`.
* **Icons:** `lucide-react` (`QrCode`, `Copy`, `Check`, `CheckCircle2`, `Clock`, `AlertCircle`, `ExternalLink`, `CreditCard`, `Building2`, `Sparkles`, `RefreshCw`).
* **HTTP Client:** `@/lib/axios` (Axios Client cấu hình sẵn, **bắt buộc import ở đầu file, không gọi axios gốc hay dùng đường dẫn trực tiếp**).
* **State & Data Fetching:** `@tanstack/react-query` (`useQuery`, `useMutation`, `useQueryClient`).
* **Toast & Notification:** `react-hot-toast`.
* **Testing:** Vitest & `@testing-library/react`.

---

## 3. Build & Test Commands
```bash
# Kiểm tra TypeScript typecheck không bị lỗi
npx tsc --noEmit

# Chạy Unit Tests
npx vitest run __tests__/components/credits/PaymentQrModal.test.tsx
npx vitest run __tests__/components/admin/payment-config/PaymentConfigTab.test.tsx

# Kiểm tra Linter
npm run lint

# Khởi chạy server phát triển local
npm run dev
```

---

## 4. Project Structure (Cấu trúc Thư mục & Component)

```text
components/
└── credits/
     ├── credit-packages-section.tsx         # [MODIFY] Mở PaymentQrModal khi chọn mua gói
     ├── PaymentQrModal.tsx                  # [NEW] Modal hiển thị VietQR, sao chép thông tin & live polling
     └── PaymentSuccessCelebration.tsx       # [NEW] Trạng thái thanh toán thành công, hiển thị số dư mới
└── admin/
     └── ai-config/
          ├── CreditQuotaTab.tsx             # [MODIFY] Đính kèm tab/mục liên kết quản trị thanh toán
          ├── PaymentConfigTab.tsx           # [NEW] Tab cấu hình thông tin ngân hàng & API Key SePay
          └── CreditOrdersTab.tsx            # [NEW] Tab tra cứu đơn nạp credit & nút duyệt thủ công
types/
└── payment.ts                               # [NEW] TypeScript interfaces cho PaymentConfig, CreditOrder
services/
└── paymentService.ts                        # [NEW] Axios API calls cho Payment Config & Credit Orders
hooks/
├── useCredits.ts                            # [MODIFY] Tách luồng mua: purchase tạo đơn -> polling trạng thái
└── usePaymentConfig.ts                      # [NEW] Hooks React Query cho Admin Payment Config & Credit Orders
```

---

## 5. Potential UI/UX Edge Cases & Mitigations

1. **Người dùng đóng Modal trong khi đang chuyển khoản:**
   - Hệ thống vẫn ghi nhận webhook SePay chạy nền và cập nhật số dư.
   - Khi người dùng vào trang Profile/Credit, số dư đã được cộng. Bảng `Lịch sử giao dịch` hiển thị rõ giao dịch `PURCHASE`.
2. **Polling liên tục gây hao tổn tài nguyên:**
   - Chỉ kích hoạt polling (mỗi 2.5s) khi `PaymentQrModal` đang mở và đơn ở trạng thái `PENDING`.
   - Tự động dừng polling khi đơn chuyển sang `SUCCESS`, `FAILED`, hoặc khi hết hạn 15 phút (timeout).
3. **Sao chép nội dung chuyển tiền:**
   - Cung cấp nút copy 1-chạm kế bên Số tài khoản và Nội dung chuyển tiền (`MAT<id>`).
   - Có hướng dẫn nổi bật: "Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống tự động cộng credit."
4. **Bảo vệ khóa bí mật SePay trên giao diện Admin:**
   - Ô nhập API Key SePay mặc định hiển thị dấu `••••••••` và có nút ẩn/hiện mật khẩu.

---

## 6. Testing Strategy
- **Unit Test cho `PaymentQrModal`:**
  - Render ảnh VietQR với URL chuẩn VietQR.
  - Test tương tác nút Copy: gọi `navigator.clipboard.writeText` và hiển thị icon `Check`.
  - Test countdown timer đếm lùi thời gian còn lại.
  - Test chuyển sang màn hình thành công khi query polling trả về `status: 'SUCCESS'`.
- **Unit Test cho `PaymentConfigTab`:**
  - Hiển thị thông tin ngân hàng hiện tại.
  - Submit form gửi payload đúng kiểu dữ liệu lên service.
