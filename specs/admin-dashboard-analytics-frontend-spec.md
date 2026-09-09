# Spec: Giao diện Thống kê Tổng quan Quản trị viên (Admin Dashboard Analytics & Visualizer)

## 1. Feature Overview & Core Objectives
Tính năng này xây dựng giao diện Bảng điều khiển Quản trị viên (Admin Dashboard) hiện đại theo phong cách Bento Grid cho hệ thống `MathClass-fe`.
* **Trung tâm điều hành số liệu theo Tháng / Năm**: Cho phép Quản trị viên tra cứu linh hoạt số liệu người dùng, lớp học, doanh thu và báo cáo sự cố ở kỳ hiện tại hoặc bất kỳ tháng nào trong quá khứ thông qua bộ lọc Tháng/Năm.
* **Biểu đồ xu hướng 12 tháng (Annual Trends)**: Trực quan hóa 2 đường cong tia mảnh (Sparklines) uốn lượn mở rộng cho Đăng ký người dùng và Doanh thu qua 12 mốc tháng (T1 -> T12), tích hợp tooltip tương tác.
* **Phân tích hiệu năng tác vụ AI**: Biểu đồ tròn Donut Chart SVG thuần đo lường tỷ trọng sử dụng 6 con AI và kiểm soát chất lượng SLA (tỷ lệ thành công/thất bại).
* **Quản lý dòng tiền nạp Credit**: Thống kê mức độ bán chạy của từng gói credit và bảng lịch sử giao dịch nạp tiền thành công tích hợp phân trang trực tiếp (In-place Pagination).
* **Bảng xem trước Nhật ký hệ thống & Báo cáo sự cố**: Bố trí 2 bảng preview (5 bản ghi mới nhất) trên cùng 1 hàng ngang với các nút "Xem chi tiết" điều hướng nhanh sang `/admin/logs` và `/admin/bug-reports`.
* **Trải nghiệm đăng nhập & Điều hướng chuẩn**: Đảm bảo tài khoản `ADMIN` khi đăng nhập hoặc click logo được chuyển hướng thẳng vào `/admin` và mục "Tổng quan" trên Sidebar chỉ active khi ở đúng trang chủ quản trị.

---

## 2. Tech Stack & Dependencies
* **Framework:** Next.js 14+ (App Router, React Server / Client Components).
* **Language:** TypeScript 5+ (Strict Type Checking).
* **Styling:** Tailwind CSS, `cn()` utility từ `@/lib/utils`.
* **Icons:** `lucide-react` (`ShieldCheck`, `Sparkles`, `RefreshCw`, `Users`, `GraduationCap`, `Banknote`, `Coins`, `AlertTriangle`, `ScrollText`, `ChevronLeft`, `ChevronRight`, `ArrowUpRight`).
* **HTTP Client:** `@/lib/axios` (Axios Client cấu hình sẵn, bắt buộc import ở đầu file).
* **Testing:** Vitest & `@testing-library/react`.

---

## 3. Build & Test Commands
```bash
# Kiểm tra TypeScript typecheck không bị lỗi
npx tsc --noEmit

# Chạy Unit Tests giao diện Dashboard
npx vitest run __tests__/components/admin/AdminDashboard.test.tsx

# Kiểm tra Linter
npm run lint

# Khởi chạy server phát triển local
npm run dev
```

---

## 4. Project Structure (Cấu trúc thư mục & Component)
```text
app/
└── admin/
     └── (dashboard)/
          └── page.tsx                         # [MODIFY] Trang Dashboard Bento Grid, bộ lọc Tháng/Năm & nạp dữ liệu
components/
└── admin/
     └── dashboard/
           ├── AdminKpiCards.tsx                # [NEW] 4 Thẻ KPI chính (Users, Classes, Revenue, Bugs)
           ├── AnnualTrendCards.tsx             # [NEW] 2 Biểu đồ tia mảnh SVG 12 tháng (Users & Revenue)
           ├── AiDistributionDonutChart.tsx     # [NEW] Biểu đồ tròn Donut SVG thuần thống kê 6 con AI
           ├── CreditPackageSalesCard.tsx       # [NEW] Danh sách tiến trình lượt mua gói credit
           ├── RecentTransactionsCard.tsx       # [NEW] Bảng lịch sử nạp tiền thành công có phân trang
           ├── RecentSystemLogsCard.tsx         # [NEW] Bảng xem trước 5 nhật ký hệ thống gần nhất
           ├── RecentBugReportsCard.tsx         # [NEW] Bảng xem trước 5 báo cáo sự cố gần nhất
           ├── MonthYearSelector.tsx            # [NEW] Dropdown chọn Tháng và Năm trong quá khứ
           └── AdminDashboardSkeleton.tsx       # [NEW] Hiệu ứng Skeleton loading toàn trang
types/
└── admin-dashboard.ts                         # [NEW] TypeScript interfaces cho DTO thống kê
services/
└── adminDashboardService.ts                   # [NEW] Service gọi API GET /api/admin/dashboard/stats
components/
├── layout/
│    ├── sidebar.tsx                           # [MODIFY] Fix active state cho mục '/admin'
│    └── header.tsx                            # [MODIFY] Cập nhật homeHref cho role ADMIN
└── auth/
     ├── admin-login-form.tsx                  # [MODIFY] Chuyển hướng ADMIN vào '/admin'
     └── login-form.tsx                        # [MODIFY] Chuyển hướng ADMIN vào '/admin'
```

---

## 5. UI/UX Component Specifications & Data Contracts

### 5.1. Thẻ Chỉ Số Tổng Quan (`AdminKpiCards.tsx`)
- **Người dùng (`UserStats`):** Tổng người dùng lũy kế, chip phân tách số Giáo viên (màu xanh lá) và Học sinh (màu xanh dương). Hiển thị số lượng tài khoản đăng ký mới `+X trong tháng` và số người dùng hoạt động trong ngày (`activeUsersToday` - DAU).
- **Lớp học (`ClassroomStats`):** Tổng số lớp học được tạo tính đến hết tháng được chọn.
- **Doanh thu (`RevenueStats`):** Icon `Banknote`, doanh thu VND định dạng tiền tệ, badge tăng trưởng so với tháng trước (`▲ +X%`), số lượng giao dịch thành công `Lượt mua: X lượt`.
- **Báo cáo sự cố (`BugReportStats`):** Số lượng báo cáo sự cố ở trạng thái `PENDING` cần xử lý.

### 5.2. Biểu Đồ Tia Mảnh Xu Hướng 12 Tháng (`AnnualTrendCards.tsx`)
- **Bố cục:** Nằm ngay dưới hàng 4 thẻ KPI, gồm 2 thẻ biểu đồ trên cùng 1 hàng ngang (`grid-cols-1 lg:grid-cols-2 gap-4`).
- **Kích thước mở rộng thoáng đãng:** Chiều cao `h-52` (viewBox `0 0 640 180`), bổ sung các đường chấm mờ ngang `strokeDasharray="4 4"` giúp đồ thị uốn lượn sang trọng, không cụt ngủn.
- **Tối giản thông tin:** Bỏ số tổng cả năm ở góc trên bên phải để tránh lặp với KPI cards; thay bằng tag `12 Tháng`.
- **2 Biểu đồ chuyên biệt:**
  1. *Tăng Trưởng Đăng Ký Năm {year}*: Line màu ngọc lục bảo (Emerald), hiển thị xu hướng 12 tháng (T1 -> T12) kèm Tooltip hover.
  2. *Xu Hướng Doanh Thu Năm {year}*: Line màu vàng hổ phách (Amber), hiển thị xu hướng doanh thu qua 12 tháng (T1 -> T12) kèm Tooltip tiền tệ VND.

### 5.3. Biểu Đồ Tròn Phân Bổ Tác Vụ AI (`AiDistributionDonutChart.tsx`)
- Đo lường 6 tác vụ: `BATCH_QUESTION_GEN`, `QUESTION_GEN`, `SUBMISSION_GRADING`, `STUDENT_HINT`, `STUDENT_REMARK`, `CANVAS_LATEX` (nhãn chuẩn: *"AI Nhận diện hình ảnh & viết tay"*).
- Biểu đồ Pure SVG Donut: Múi màu tương ứng với từng tác vụ, tâm donut hiển thị % thị phần và số lượt gọi khi hover.
- Bảng danh sách bên cạnh: Badge SLA tỷ lệ thành công màu sắc (`>=95%` xanh lá, `85-94.9%` cam, `<85%` đỏ) kèm chi tiết `vd: 98% thành công (490/500)`.

### 5.4. Thống Kê Gói Credit (`CreditPackageSalesCard.tsx`)
- Icon tiêu đề `Coins` (đồng xu), thanh tiến trình đo lường số lượt mua của từng gói credit trong tháng.

### 5.5. Bảng Lịch Sử Nạp Tiền (`RecentTransactionsCard.tsx`)
- Hiển thị danh sách các đơn nạp credit thành công trong tháng.
- Lược bỏ cột "Trạng Thái" và badge "Thành công" (vì toàn bộ đơn đều là `SUCCESS`).
- Phân trang trực tiếp tại bảng: Trước/Sau, danh sách trang, tùy chọn số dòng/trang (5, 10, 20, 50).

### 5.6. Bảng Xem Trước Nhật Ký Hệ Thống & Báo Cáo Sự Cố
- **Bố cục:** Đặt ngay dưới Bảng Lịch Sử Nạp Tiền, nằm trên cùng 1 hàng ngang (`grid grid-cols-1 lg:grid-cols-2 gap-6`).
- **`RecentSystemLogsCard.tsx` (5 log gần nhất):**
  - Cột: Người thực hiện (Gmail `actor`), Danh mục (`resourceType`), Mô tả hành động (`action`), Thời gian (`createdAt`).
  - Nút "Xem chi tiết" dẫn sang `/admin/logs`.
- **`RecentBugReportsCard.tsx` (5 sự cố gần nhất):**
  - Cột: Người gửi (Gmail `reporterEmail`), Loại sự cố (`errorType`), Trạng thái (`status` với badge màu: Chờ xử lý, Đang xử lý, Đã xử lý, Đã hủy), Thời gian (`createdAt`).
  - Nút "Xem chi tiết" dẫn sang `/admin/bug-reports`.

---

## 6. Boundaries & Coding Standards

* **Luôn làm (`Always do`)**:
  * Import tất cả module, components, icons, utils ở đầu file bằng alias chuẩn `@/...`.
  * Sử dụng Axios instance `@/lib/axios` cho toàn bộ yêu cầu gọi API.
  * Sử dụng Tailwind CSS classes, không dùng inline styles (`style={{...}}`).
  * Sử dụng component thuần SVG cho biểu đồ, không cài thêm thư viện chart nặng nề bên ngoài.
  * Kiểm tra kiểu dữ liệu nghiêm ngặt qua `npx tsc --noEmit` trước khi hoàn tất.
* **Cần xác nhận trước (`Ask first`)**:
  * Thay đổi cấu trúc điều hướng hoặc các route đích của Admin (`/admin/logs`, `/admin/bug-reports`).
* **Không bao giờ làm (`Never do`)**:
  * Dùng prefix `/api/v1/...` khi gọi API (chuẩn backend là `/api/admin/dashboard/stats`).
  * Để thanh Sidebar active chéo mục "Tổng quan" khi đang ở các trang con `/admin/*`.
  * Sử dụng icon ngôi sao sa (Sparkles) giống phong cách Gemini cho tính năng AI hay credit.

---

## 7. Acceptance Criteria Checklist

1. [ ] **AC-FE-01 (Admin Redirect):** Admin sau khi đăng nhập thành công được chuyển hướng trực tiếp vào `/admin`.
2. [ ] **AC-FE-02 (Sidebar Exact Match):** Mục "Tổng quan" trên Sidebar chỉ active khi ở đúng pathname `/admin`.
3. [ ] **AC-FE-03 (Month/Year Picker):** Cho phép chọn tháng (1-12) và năm; dữ liệu toàn trang tự động reload theo mốc thời gian đã chọn.
4. [ ] **AC-FE-04 (KPI Display):** 4 Thẻ KPI hiển thị đúng số liệu người dùng, lớp học, doanh thu và bug pending.
5. [ ] **AC-FE-05 (12-Month Sparklines):** Biểu đồ tia mảnh hiển thị đầy đủ 12 tháng T1 -> T12 với chiều cao `h-52`, đường chấm mờ ngang và tooltip hover.
6. [ ] **AC-FE-06 (AI Donut Chart & SLA):** Biểu đồ tròn hiển thị chuẩn tỷ lệ 6 con AI, hiển thị badge tỷ lệ thành công (ví dụ: `98% thành công (490/500)`).
7. [ ] **AC-FE-07 (Transactions In-place Pagination):** Bảng nạp tiền không còn cột Trạng thái, hỗ trợ chuyển trang và đổi số dòng/trang trực tiếp.
8. [ ] **AC-FE-08 (Logs & Bug Reports Preview):** 2 Bảng xem trước hiển thị 5 bản ghi mới nhất, nằm trên cùng 1 hàng ngang dưới bảng nạp tiền, có nút dẫn đến `/admin/logs` và `/admin/bug-reports`.
9. [ ] **AC-FE-09 (Testing & Typecheck):** Toàn bộ Unit Tests vitest và TypeScript typecheck đạt 100% không phát sinh lỗi.

---

## 8. Comprehensive Test Cases Matrix (Danh sách Test Cases kiểm thử)

| Mã TC | Phân loại | Tên Component / Test Case | Thao tác / Điều kiện đầu vào | Kết quả mong đợi (Expected Outcome) |
| :--- | :--- | :--- | :--- | :--- |
| **TC-FE-01** | **KPI Cards** | Hiển thị 4 thẻ chỉ số KPI tổng quan | Render `AdminKpiCards` với dữ liệu `mockStats`. | Hiển thị đầy đủ tổng người dùng (1,250), giáo viên (180), học sinh (1,070), số lớp (52), doanh thu (15.500.000 ₫) và số lỗi chờ xử lý (5). |
| **TC-FE-02** | **KPI Cards** | Ẩn DAU khi tra cứu tháng quá khứ | Dữ liệu `activeUsersToday = 0`. | Không hiển thị dòng DAU hoạt động hôm nay, giữ giao diện gọn gàng. |
| **TC-FE-03** | **Annual Trends** | Hiển thị 2 biểu đồ tia mảnh 12 tháng mở rộng | Render `AnnualTrendCards` với `userTrends`, `revenueTrends` và `year=2026`. | Hiển thị tiêu đề "Tăng Trưởng Đăng Ký Năm 2026" và "Xu Hướng Doanh Thu Năm 2026". Hiển thị tag "12 Tháng", các mốc T1, T6, T12. |
| **TC-FE-04** | **Annual Trends** | Lược bỏ số tổng ở góc biểu đồ | Render `AnnualTrendCards`. | Không tìm thấy các text số tổng cũ ở góc trên bên phải đồ thị (tránh lặp với 4 thẻ KPI). |
| **TC-FE-05** | **AI Donut Chart** | Hiển thị biểu đồ phân bổ AI và badge SLA | Render `AiDistributionDonutChart` với 6 tác vụ AI. | Hiển thị đúng tên các con AI (bao gồm "AI Nhận diện hình ảnh & viết tay"), các badge tỷ lệ thành công (ví dụ: "98% thành công"). |
| **TC-FE-06** | **Credit Sales** | Thống kê xếp hạng gói credit | Render `CreditPackageSalesCard` với `packageSales`. | Hiển thị tiêu đề thẻ với icon Coins, hiển thị tên gói "Gói Khởi Động" (45 lượt), "Gói Tiêu Chuẩn" (30 lượt). |
| **TC-FE-07** | **Transactions** | Hiển thị bảng nạp tiền & lược bỏ cột Trạng thái | Render `RecentTransactionsCard` với `recentTransactions`. | Hiển thị tên người nạp ("Thầy Hoàng Nam"), số tiền, số credit "+600". Cột "Trạng Thái" và badge "Thành công" **không tồn tại**. |
| **TC-FE-08** | **Transactions** | Phân trang trực tiếp tại bảng nạp tiền | Chọn số dòng/trang hoặc bấm nút chuyển trang tiếp theo. | Bảng cập nhật danh sách hiển thị theo `startIndex` và `pageSize`, hiển thị đúng "Hiển thị Trang X / Y". |
| **TC-FE-09** | **Date Filter** | Cho phép thay đổi tháng và năm báo cáo | Thay đổi select tháng sang `5` và năm sang `2025` trong `MonthYearSelector`. | Hàm callback `onChange` được gọi chính xác với tham số `(5, 2025)`. |
| **TC-FE-10** | **Date Filter** | Nút "Về tháng hiện tại" khi xem quá khứ | Render `MonthYearSelector` với tháng/năm quá khứ. | Xuất hiện nút "Về tháng hiện tại". Khi click, kích hoạt chuyển về tháng và năm của ngày hôm nay. |
| **TC-FE-11** | **Logs Preview** | Hiển thị 5 nhật ký hệ thống & nút Xem chi tiết | Render `RecentSystemLogsCard` với `logs`. | Hiển thị tiêu đề "Nhật Ký Hệ Thống", thông tin người thực hiện (`actor`), danh mục (`resourceType`), mô tả hành động, và nút "Xem chi tiết" có `href="/admin/logs"`. |
| **TC-FE-12** | **Bugs Preview** | Hiển thị 5 báo cáo sự cố & nút Xem chi tiết | Render `RecentBugReportsCard` với `reports`. | Hiển thị tiêu đề "Báo Cáo Sự Cố", người gửi (`reporterEmail`), loại lỗi (`errorType`), badge trạng thái "Chờ xử lý", và nút "Xem chi tiết" có `href="/admin/bug-reports"`. |
| **TC-FE-13** | **Layout Grid** | Bố trí 2 bảng preview trên cùng 1 hàng ngang | Kiểm tra markup render trong `app/admin/(dashboard)/page.tsx`. | `RecentSystemLogsCard` và `RecentBugReportsCard` được bọc trong `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">` ngay dưới `RecentTransactionsCard`. |
| **TC-FE-14** | **Sidebar Fix** | Mục "Tổng quan" không bị sáng chéo | Kiểm tra active logic trong `components/layout/sidebar.tsx`. | Khi URL là `/admin/users` hoặc `/admin/bug-reports`, mục "Tổng quan" (`/admin`) ở trạng thái inactive; chỉ active khi `pathname === '/admin'`. |
