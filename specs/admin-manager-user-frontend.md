# Đặc tả Kỹ thuật Frontend (Frontend Specification)

**Chức năng:** Trang Quản lý Người dùng (User Management)

## 1. Tech Stack & Cấu trúc Thư mục

* **Framework:** Next.js 14+ (App Router).
* **Styling:** Tailwind CSS.
* **UI Components:** Radix UI / Shadcn UI (`Table`, `Input`, `Select`, `Switch`, `Badge`).
* **Icons:** Lucide React (`Search`, `Users`, `ChevronLeft`, `ChevronRight`).
* **Data Fetching & State:** React Query (`@tanstack/react-query`) kết hợp `useDebounce` cho ô tìm kiếm.
* **Toast Notification:** `sonner`.
* **Utility:** `cn` từ `@/lib/utils` (clsx + tailwind-merge).

### Cấu trúc file thực tế (`app/admin/users`)

> **Lưu ý:** Dự án sử dụng route group `admin/` (không có dấu ngoặc đơn), không phải `(admin)/`.
> Pattern chuẩn của dự án: `page.tsx` là Server Component chỉ export metadata + render một `*-client.tsx`.
> Logic UI và state nằm trong `_components/*-client.tsx`.

```text
app/
 └── admin/
      └── users/
           ├── page.tsx                   # Server Component — export metadata, render <UsersClient />
           └── _components/
                ├── users-client.tsx      # 'use client' — toàn bộ UI, state, API logic
                └── status-switch.tsx     # Switch component tái sử dụng (Khóa / Mở khóa)
```

**Hooks toàn cục** (dùng chung, đặt tại `hooks/`):
* `hooks/useAdmin.ts` — `useAdminUsers()`, `useUpdateUserStatus()`
* `hooks/useDebounce.ts` — debounce search input
* `hooks/useAuth.ts` — lấy thông tin user đang đăng nhập (`currentUser.id`)

**Services** (đặt tại `services/`):
* `services/adminService.ts` — `getUsers()`, `updateUserStatus()`

---

## 2. Đặc tả Giao diện & Component Chi tiết

### 2.1. Tiêu đề & Thông tin tổng quan

* **Tiêu đề trang:** `Quản lý Người dùng` (Font weight: Bold, Size: 3XL — `text-3xl font-bold tracking-tight`).
* **Bộ đếm số lượng:** Hiển thị bên dưới tiêu đề, dòng chữ `Hiển thị X / Y người dùng` (Ví dụ: `Hiển thị 9 / 9 người dùng`).
  * `X`: `data.numberOfElements` — số bản ghi ở trang hiện tại.
  * `Y`: `data.totalElements` — tổng số bản ghi trong hệ thống.
* **SEO Metadata** (khai báo trong `page.tsx`):
  * `title`: `"Quản lý Người dùng – Math Class"`
  * `description`: `"Quản lý tài khoản người dùng trong hệ thống Math Class"`

### 2.2. Thanh Bộ Lọc & Tìm Kiếm (Filter Bar)

Bao gồm 3 thành phần nằm ngang (flex, gap-3, flex-wrap):

1. **Ô tìm kiếm (Input Search):**
   * **Icon:** `Search` (Lucide) nằm bên trái bên trong input (`pl-9`).
   * **Placeholder:** `"Tìm kiếm theo email hoặc tên..."`
   * **id:** `user-search-input`
   * **Xử lý:** Áp dụng `useDebounce` (300ms) trước khi trigger gọi API. Reset `page` về `0` khi giá trị thay đổi.

2. **Lọc theo Vai trò (Select Role Filter):**
   * **id:** `user-role-filter`
   * **Default Label:** `"Tất cả vai trò"`
   * **Options (value → label):**
     * `ALL` → `Tất cả vai trò`
     * `ADMIN` → `ADMIN`
     * `TEACHER` → `TEACHER`
     * `STUDENT` → `STUDENT`
   * Reset `page` về `0` khi thay đổi.

3. **Lọc theo Trạng thái (Select Status Filter):**
   * **id:** `user-status-filter`
   * **Default Label:** `"Tất cả trạng thái"`
   * **Options (value → label):**
     * `ALL` → `Tất cả trạng thái`
     * `ACTIVE` → `Hoạt động`
     * `LOCKED` → `Bị khóa`
   * Reset `page` về `0` khi thay đổi.
   * **Ánh xạ sang API param:** `ACTIVE` → `isActive=true`, `LOCKED` → `isActive=false`, `ALL` → không gửi param.

### 2.3. Bảng Dữ Liệu Người Dùng (Data Table)

Giao diện dạng Bảng (`rounded-md border bg-white`) với các cột:

| Tên Cột | Kiểu Dữ Liệu | Quy Tắc UI & Styling |
| --- | --- | --- |
| **ID** | `number` | `text-muted-foreground`, căn trái, width cố định `w-16`. |
| **Họ tên** | `string` | `font-medium`, căn trái. |
| **Email** | `string` | `text-muted-foreground`, căn trái. |
| **Vai trò** | Badge (Pill) | Dùng class `rounded-full font-medium`. Màu theo role:<br>• **`ADMIN`**: `bg-red-600 text-white`<br>• **`TEACHER`**: `bg-blue-600 text-white`<br>• **`STUDENT`**: `bg-orange-100 text-orange-700` |
| **Trạng thái** | Badge (Pill) | Dùng class `rounded-full font-medium`:<br>• **`Hoạt động`** (`active=true`): `bg-green-600 text-white`<br>• **`Bị khóa`** (`active=false`): `bg-red-600 text-white` |
| **Hành động** | `StatusSwitch` component | Switch + Label động. Xem mục 2.4. |

**Loading State:** Khi `isLoading=true`, hiển thị `<Spinner />` căn giữa trong một row `colSpan={6}` với `h-32`.

**Empty State:** Khi không có dữ liệu, hiển thị icon `Users` (opacity-40) và text `"Không tìm thấy người dùng phù hợp"` căn giữa trong row `h-36`.

### 2.4. Component `StatusSwitch` (`status-switch.tsx`)

Props:

| Prop | Type | Mô tả |
| --- | --- | --- |
| `userId` | `number` | ID người dùng |
| `isActive` | `boolean` | Trạng thái hiện tại |
| `isCurrentUser` | `boolean` | `true` nếu là tài khoản đang đăng nhập |
| `isPending` | `boolean` | `true` khi có bất kỳ request toggle nào đang chạy |
| `onToggle` | `(userId, currentIsActive) => void` | Callback khi click |

Logic:
* `disabled = isPending || isCurrentUser`
* Label động: `isActive=true` → `"Khóa"`, `isActive=false` → `"Mở khóa"`
* `id` của Switch: `status-switch-{userId}`

---

## 3. Tích hợp API & Luồng Xử Lý (Data Fetching & State)

### 3.1. Các API Endpoints

| Chức năng | Method | Endpoint | Query Params / Payload |
| --- | --- | --- | --- |
| Lấy danh sách users | `GET` | `/admin/users` | `?page={page}&role={ROLE}&isActive={boolean}&search={query}` |
| Cập nhật Trạng thái | `PATCH` | `/admin/users/{id}/status` | `{ "isActive": boolean }` |

> **Lưu ý:** Base URL `/api` được cấu hình tại `lib/axios.ts`. Các endpoint trong `adminService.ts` không cần prefix `/api`.

### 3.2. Hooks & Service

**`hooks/useAdmin.ts`:**
```ts
useAdminUsers(page, role?, isActive?, search?)  // GET /admin/users
useUpdateUserStatus()                            // PATCH /admin/users/{id}/status
```

**`services/adminService.ts`:**
```ts
adminService.getUsers(page, role?, isActive?, search?)
adminService.updateUserStatus(userId, isActive)
```

### 3.3. Quản lý State trong `UsersClient`

| State | Type | Mô tả |
| --- | --- | --- |
| `page` | `number` | Trang hiện tại (0-indexed) |
| `role` | `string` | `'ALL'` hoặc `'ADMIN'/'TEACHER'/'STUDENT'` |
| `statusFilter` | `string` | `'ALL'`, `'ACTIVE'`, hoặc `'LOCKED'` |
| `search` | `string` | Giá trị raw của input search |
| `pendingUserId` | `number \| null` | ID user đang được toggle; `null` khi rảnh |

`debouncedSearch` = `useDebounce(search, 300)` — dùng để gọi API.

### 3.4. Luồng Đổi Trạng Thái (Toggle User Status)

1. User click Switch → `handleStatusToggle(userId, currentIsActive)`.
2. Nếu `pendingUserId !== null` → **chặn**, không thực hiện (tránh race condition).
3. `setPendingUserId(userId)` → disable **toàn bộ** các Switch trong bảng.
4. Gọi `updateUserStatus.mutate({ userId, isActive: !currentIsActive })`.
5. **Thành công (200 OK):**
   * `invalidateQueries(['admin-users'])` → React Query refetch, UI tự cập nhật Badge & Switch.
   * Toast success: `"Cập nhật trạng thái người dùng thành công!"` (sonner, màu xanh).
6. **Thất bại (4xx / 5xx):**
   * Switch tự khôi phục (data không thay đổi vì không dùng optimistic update).
   * Toast error: `"Không thể thay đổi trạng thái. Vui lòng thử lại!"` (sonner, màu đỏ).
7. `onSettled` → `setPendingUserId(null)` → mở khóa các Switch.

---

## 4. Edge Cases & Xử lý Lỗi

* **Empty State:** Filter/search không có kết quả → hiển thị icon `Users` + text `"Không tìm thấy người dùng phù hợp"`.
* **Tự khóa tài khoản:** Switch của `user.id === currentUser?.id` luôn `disabled`, ngăn Admin tự khóa mình.
* **Reset Pagination:** Mọi thay đổi filter (`role`, `statusFilter`) hoặc `search` đều reset `page` về `0`.
* **Race Condition / Slow Network:** Khi đang có một toggle request in-flight (`pendingUserId !== null`), mọi Switch đều bị disable. Request mới bị chặn ở đầu hàm `handleStatusToggle`.
* **Phân trang:** Chỉ hiển thị pagination khi `data.totalPages > 1`. Nút "Trang trước" disable khi `page === 0`; nút "Trang sau" disable khi `page >= totalPages - 1`.