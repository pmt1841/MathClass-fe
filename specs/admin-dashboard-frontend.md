# Đặc tả Kỹ thuật Frontend (Frontend Specification)

**Chức năng:** Admin Dashboard (Quản lý Người dùng, Phân quyền Động, Nhật ký Hệ thống)

---

## 1. Tech Stack & Cấu trúc Thư mục

* **Framework:** Next.js 14+ (App Router).
* **Styling:** Tailwind CSS.
* **UI Components:** Radix UI / Shadcn UI (Ví dụ: `Table`, `Switch/Toggle`, `Badge`, `Pagination`, `Tabs`).
* **Icons:** Lucide React.
* **Data Fetching:** Fetch API kết hợp với React Server Components (RSC) hoặc SWR/React Query cho Client Components.

### Cấu trúc file dự kiến (`app/(admin)`)

Bảo mật bằng Middleware (kiểm tra JWT role `ADMIN`) để ngăn chặn việc người dùng thường truy cập vào layout `(admin)`.

```text
app/
 └── (admin)/
      ├── layout.tsx                  # Layout dành riêng cho Admin (chứa Sidebar Admin)
      ├── users/
      │    └── page.tsx               # Trang danh sách & quản lý người dùng
      ├── logs/
      │    └── page.tsx               # Trang xem nhật ký hệ thống
      ├── roles/
      │    └── page.tsx               # Trang cài đặt phân quyền động (Dynamic Role Permissions)
      └── community-repo/
           └── page.tsx               # Trang chờ (Coming soon)
```

---

## 2. Đặc tả Giao diện & Component Chi tiết

### 2.1. Layout & Sidebar Admin (`app/(admin)/layout.tsx`)

* **Tái sử dụng Component:** Tái sử dụng `components/layout/sidebar.tsx` hiện tại.
* **Thay đổi:** Refactor để `Sidebar` có thể nhận prop `navItems`. Thay vì hardcode menu của Giáo viên/Học sinh, ta sẽ truyền mảng menu của Admin vào:
  * Tổng quan (Home/Dashboard)
  * Quản lý Người dùng
  * Phân quyền (Roles)
  * Nhật ký Hệ thống (Logs)
  * Kho bài tập (Coming Soon)

### 2.2. Trang Quản lý Người dùng (`/admin/users`)

* **Thành phần chính:** Một Data Table (Bảng).
* **Cột hiển thị:** ID, Họ tên, Email, Vai trò (Role), Trạng thái (Status - Active/Locked), Hành động.
* **Tính năng:**
  * **Phân trang (Pagination):** Sử dụng các nút Next/Prev, query params `?page=0`.
  * **Bộ lọc (Filter):** Dropdown chọn Role (TEACHER, STUDENT, v.v.), Dropdown chọn Trạng thái (Hoạt động / Bị khóa).
  * **Hành động (Action):** Nút "Khóa" (màu đỏ) hoặc "Mở khóa" (màu xanh lá) gọi API `PATCH /api/admin/users/{id}/status`.
  * Hiển thị Toast Notification (thông báo góc màn hình) sau khi đổi trạng thái thành công.

### 2.3. Trang Cài đặt Phân quyền Động (`/admin/roles`)

Đây là giao diện cấu hình quyền truy cập động cho các Role.

* **Layout:** 
  * Phần bên trái hoặc phía trên: Chọn **Role** cần cấu hình (Sử dụng `<Tabs>` hoặc `<Select>` dropdown. Ví dụ: Chọn thẻ `Giáo viên (TEACHER)` hoặc `Học sinh (STUDENT)`).
  * Phần hiển thị chính: Một danh sách/bảng các Quyền (Permissions) có sẵn trong hệ thống (lấy từ API `GET /api/admin/roles/permissions`).
* **Hiển thị từng Quyền:** 
  * **Tên quyền:** (Ví dụ: `DELETE_CLASS` - Xóa lớp học)
  * **Mô tả:** (Ví dụ: "Cho phép giáo viên xóa lớp học khỏi hệ thống")
  * **Hành động:** Nút gạt **(Toggle / Switch)**. 
    * Nếu quyền đang được cấp cho Role -> Nút Switch bật (Màu xanh).
    * Nếu quyền không được cấp -> Nút Switch tắt (Màu xám).
* **Lưu thay đổi:**
  * Cách 1 (Auto-save): Khi gạt Switch, tự động gọi API `PUT /api/admin/roles/{role}/permissions` để lưu ngay lập tức.
  * Cách 2 (Manual-save): Có một nút "Lưu cấu hình" ở góc phải. Gạt bao nhiêu nút cũng được, khi bấm Lưu mới gom các ID quyền đang bật gửi lên API. *(Khuyên dùng Cách 2 để tránh gọi API quá nhiều lần nếu admin gạt nhiều nút cùng lúc).*

### 2.4. Trang Nhật ký Hệ thống (`/admin/logs`)

* **Thành phần chính:** Data Table.
* **Cột hiển thị:** Thời gian (Format `DD/MM/YYYY HH:mm`), Đối tượng thực hiện (Actor), Cấp độ (Level), Mô tả hành động.
* **Styling đặc biệt (Badges):**
  * `INFO`: Badge màu xanh dương (Blue) hoặc xanh lá.
  * `WARNING`: Badge màu vàng/cam (Yellow/Orange).
  * `ERROR`: Badge màu đỏ (Red).
* **Tính năng:** Phân trang, Lọc theo khoảng thời gian (Date Picker) và Lọc theo Mức độ lỗi (Level Dropdown).

---

## 3. Tích hợp API (Data Fetching Hooks)

Dưới đây là các đường dẫn API Backend sẽ được Frontend gọi tới:

| Chức năng | Method | Endpoint | Dữ liệu gửi đi (Payload) |
| --- | --- | --- | --- |
| Lấy danh sách users | `GET` | `/api/admin/users?page={0}&role={R}` | *Query Params* |
| Khóa/Mở khóa user | `PATCH` | `/api/admin/users/{id}/status` | `{ "isActive": false }` |
| Lấy lịch sử log | `GET` | `/api/admin/logs?page={0}&level={L}` | *Query Params* |
| Lấy tất cả quyền có sẵn | `GET` | `/api/admin/roles/permissions` | *None* |
| Lấy quyền của Role A | `GET` | `/api/admin/roles/{roleName}/permissions` | *None* |
| Cập nhật quyền Role A | `PUT` | `/api/admin/roles/{roleName}/permissions` | `{ "permissionIds": [1, 3, 4] }` |

## 4. Xử lý Lỗi (Error Handling)

* **HTTP 401/403:** Nếu nhận lỗi không đủ quyền, ngay lập tức đẩy người dùng về trang `/login` hoặc `/home` và xóa token (nếu token hết hạn).
* **HTTP 400/500:** Bắt lỗi bằng `try/catch` hoặc thông qua các hook quản lý fetch (SWR), hiển thị Toast Error màu đỏ (Ví dụ: "Cập nhật quyền thất bại. Vui lòng thử lại sau.").
* **Loading States:** Hiển thị Spinner hoặc Skeleton Loading khi bảng đang tải dữ liệu hoặc khi bấm nút Lưu/Khóa (tránh việc người dùng bấm nhiều lần cùng lúc).
