# Spec: Giao diện Dynamic Tag Input cho Bài tập (Teacher Role Frontend)

## 1. Objective (Mục tiêu)

Đặc tả này quy định việc nâng cấp trải nghiệm phân loại bài tập cho Giáo viên trên giao diện Web Frontend (`MathClass-fe`):
* **Chuyển đổi UI**: Thay thế các nút bấm phân loại 3 nhóm cố định (*Khối lớp, Phân môn, Độ khó*) bằng **Trường nhập Dynamic Tag Input (Chip UI)** tại màn hình **Tạo/Sửa bài tập** và **Popover chỉnh sửa Tag trên Thẻ bài tập** ở Kho bài tập.
* **Chip UI với nút xóa `x`**: Mỗi tag đính kèm hiển thị dạng thẻ chip gọn gàng có **nút `x` ở góc phải** để người dùng dễ dàng nhấp xóa (hoặc nhấn `Backspace`).
* **Tra cứu & Gợi ý Autocomplete**: Khi người dùng gõ ký tự vào ô input (ví dụ: `L`, `10`), component tự động tra cứu từ API và hiển thị menu dropdown gợi ý các tag sẵn có trong hệ thống.
* **Hỗ trợ luồng linh hoạt (Phương án B)**: Bài nháp/tạo thủ công/sinh bài AI cho phép lưu mà không cần tag. Bắt buộc có ít nhất 1 tag khi gạt công khai lên Thư viện (`PUBLIC`).
* **Sửa lỗi & Cho phép sửa tag bài PUBLIC**: Sửa lỗi Popover card không hiển thị tag đã gắn; bỏ quy định chặn sửa tag khi bài tập đang `PUBLIC`.

---

## 2. Tech Stack & Environment

* **Core Framework**: Next.js 16 (App Router), React 19, TypeScript 5.7.
* **Styling**: Tailwind CSS v4, Lucide React (Icons `X`, `Tag`, `Plus`).
* **State & Data Fetching**: TanStack React Query v5, Axios (`@/lib/axios`).
* **Toast Notification**: Sonner (`toast.success`, `toast.error`).

---

## 3. Build & Test Commands

```bash
# Chạy môi trường Development
npm run dev

# Kiểm tra Linter & Type Check
npm run lint
npx tsc --noEmit

# Chạy Unit & Component Tests
npm run test

# Đóng gói ứng dụng Production
npm run build
```

---

## 4. Project Structure (Cấu trúc thư mục liên quan)

```
app/
└── (dashboard)/
    └── assignments/
        ├── page.tsx                             # Kho bài tập
        ├── create/
        │   └── _components/
        │       └── AssignmentForm.tsx           # [MODIFY] Tích hợp AssignmentTagInput
        └── _components/
            ├── assignment-card.tsx              # [MODIFY] Popover sửa tag & Chip UI
            └── assignments-client.tsx           # Trang quản lý bài tập
components/
├── assignments/
│   ├── assignment-tag-input.tsx                 # [NEW] Component Dynamic Tag Input Chips & Autocomplete
│   └── assignment-tag-pills.tsx                 # [MODIFY] Component hiển thị danh sách Tag Chips
└── ui/
    └── visibility-toggle.tsx                    # [MODIFY] Kiểm tra tag trước khi gạt PUBLIC
services/
└── assignmentService.ts                         # [MODIFY] Thêm API getTags(query), updateAssignment(tagNames)
```

---

## 5. Detailed Specifications & Schemas

### 5.1 Data Model & UI State

```ts
export interface AssignmentTag {
  id: number
  name: string
  active?: boolean
}

export interface Assignment {
  id: number
  title: string
  description?: string
  content?: string
  visibility: 'PRIVATE' | 'PUBLIC'
  tags?: AssignmentTag[]
}
```

### 5.2 Component Specifications

#### A. Component `AssignmentTagInput.tsx`
* **Props**:
  * `selectedTagNames: string[]` - Danh sách tên tag đang được chọn.
  * `onChange: (names: string[]) => void` - Callback khi danh sách tag thay đổi.
  * `placeholder?: string` - Placeholder cho ô input (mặc định: `"Nhập tag bài tập..."`).
* **Hành vi UX/UI**:
  1. Render danh sách các Tag Chips hiện tại: Mỗi chip hiển thị tên tag kèm nút `x` nhỏ góc phải.
  2. Click nút `x` ➔ Loại bỏ tag khỏi mảng `selectedTagNames`.
  3. Nhấn `Backspace` khi ô input đang rỗng ➔ Xóa chip cuối cùng.
  4. Gõ từ khóa vào ô input ➔ Debounce 150ms gọi `assignmentService.getTags(query)` lấy gợi ý.
  5. Menu gợi ý (Dropdown) xuất hiện phía dưới ô input. Nhấp chọn gợi ý hoặc gõ từ mới + nhấn `Enter` / `,` để đính kèm tag.

#### B. Component `VisibilityToggle.tsx`
* **Hành vi**:
  * Khi người dùng bật công khai (`checked = true`): Kiểm tra danh sách tag của bài tập.
  * Nếu `assignment.tags` rỗng ➔ Rollback công tắc về `PRIVATE`, hiển thị toast lỗi *"Vui lòng gắn ít nhất 1 tag trước khi công khai lên Thư viện cộng đồng"* và kích hoạt Popover Tag Input để giáo viên điền tag.

---

## 6. Boundaries (Ranh giới & Quy tắc)

* **Luôn làm (`Always do`)**:
  * Tự động loại bỏ khoảng trắng thừa (trim) ở hai đầu tên tag.
  * Bọc debounce khi người dùng gõ từ khóa tìm kiếm autocomplete để tối ưu request.
  * Dùng `AssignmentTagInput` đồng bộ tại cả trang Tạo bài tập và Popover trên Card bài tập.
* **Cần xác nhận trước (`Ask first`)**:
  * Thay đổi cấu trúc hiển thị màu sắc của Tag Pills trên Thẻ bài tập.
* **Không bao giờ làm (`Never do`)**:
  * Hiển thị thông báo chặn sửa tag khi bài tập đang ở trạng thái `PUBLIC`.
  * Hardcode danh sách tag tĩnh ở client; luôn tra cứu từ API Backend.

---

## 7. Success Criteria (Tiêu chí Nghiệm thu)

1. [ ] Component `AssignmentTagInput` hiển thị các Tag Chips có nút `x` ở góc phải và xóa tag mượt mà.
2. [ ] Ô input tự động xổ menu gợi ý Autocomplete khớp với từ khóa người dùng gõ.
3. [ ] Tạo bài tập nháp không có tag lưu thành công mà không bị chặn form.
4. [ ] Popover sửa tag trên Thẻ bài tập hiển thị chính xác các tag đã gắn sẵn (khắc phục lỗi hiện *"Không có tag"*).
5. [ ] Cho phép sửa tag thành công đối với bài tập đang `PUBLIC`.
6. [ ] Gạt công khai bài tập chưa có tag bị chặn và tự động mở gợi ý điền tag.
7. [ ] Chạy `npx tsc --noEmit` và `npm run lint` không phát sinh lỗi.

---

## 8. Comprehensive Test Cases Matrix (Danh sách Test Cases kiểm thử)

| Mã TC | Phân loại | Tên Test Case | Điều kiện đầu vào / Bước thực hiện | Kết quả mong đợi (Expected Outcome) |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | **UI Chip** | Xóa Tag Chip bằng nút `x` | Nhấp vào biểu tượng `x` góc phải trên 1 Tag Chip. | Tag đó lập tức xóa khỏi danh sách chip. |
| **TC02** | **UI Chip** | Xóa Tag Chip bằng phím `Backspace` | Xóa hết chữ trong ô input, sau đó nhấn phím `Backspace`. | Tag Chip ở vị trí cuối cùng bị xóa khỏi danh sách. |
| **TC03** | **Autocomplete** | Tra cứu từ khóa gợi ý Tag | Gõ từ `Lớp` vào ô Tag Input. | Menu Dropdown hiển thị danh sách các tag chứa từ `Lớp` (ví dụ: `Lớp 10`, `Lớp 11`). |
| **TC04** | **Autocomplete** | Chọn Tag từ Menu gợi ý | Click vào 1 tag trong Menu gợi ý Dropdown. | Tag được thêm vào mảng Chip, ô input được xóa rỗng và ẩn Menu gợi ý. |
| **TC05** | **Autocomplete** | Thêm Tag hoàn toàn mới bằng nút Enter | Gõ `Bất đẳng thức Cosi` rồi nhấn phím `Enter`. | Tag `Bất đẳng thức Cosi` được thêm vào danh sách Chip. |
| **TC06** | **Form Create** | Tạo bài tập không có tag | Để trống trường Tag ở màn hình Tạo bài tập và bấm "Lưu nháp". | Tạo bài tập thành công, thẻ bài tập ở Kho bài tập hiển thị nút `Chưa phân loại`. |
| **TC07** | **Card Popover** | Mở Popover sửa tag bài tập đã có tag | Click vào các nút Tag Pills trên 1 bài tập đã có 2 tag `Lớp 10`, `Đại số`. | Popover mở ra và hiển thị đúng 2 Tag Chips `Lớp 10` và `Đại số` (không còn bị lỗi *"Không có tag"*). |
| **TC08** | **Card Popover** | Sửa tag trực tiếp trên bài tập đang `PUBLIC` | Click mở Popover trên card bài `PUBLIC`, thêm 1 tag mới và bấm "Lưu tag". | Lưu tag thành công, hiển thị toast thông báo thành công và cập nhật UI card ngay lập tức. |
| **TC09** | **Public Toggle** | Gạt công khai bài tập chưa có tag | Click công tắc "Công khai" trên card bài tập có nhãn `Chưa phân loại`. | Công tắc giữ nguyên `Riêng tư`, xuất hiện toast nhắc nhở bổ sung tag và mở Popover Tag Input. |
| **TC10** | **Public Toggle** | Gạt công khai bài tập đã có tag | Click công tắc "Công khai" trên card bài tập đã có 1 tag trở lên. | Chuyển trạng thái bài tập sang `PUBLIC` thành công và hiển thị toast thông báo. |
