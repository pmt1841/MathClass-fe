# Đặc tả Kỹ thuật Frontend (Frontend Specification)

**Chức năng:** Khôi phục Phân quyền Mặc định cho Vai trò (Reset Role Permissions UI) - Ticket MAT-263

---

## 1. Tổng quan & Mục tiêu Architecture

* **Mục tiêu**: Bổ sung tính năng cho phép Admin đặt lại phân quyền của nhóm Giáo viên (`TEACHER`) hoặc Học sinh (`STUDENT`) về trạng thái mặc định ban đầu trực tiếp tại màn hình Cài đặt Phân quyền (`/admin/roles`).
* **Đặc điểm tương tác (UX Flow)**:
  * Nút **"Khôi phục mặc định"** hiển thị cạnh nút "Lưu cài đặt".
  * Nhấn vào nút sẽ mở `AlertDialog` xác nhận (Confirm Dialog).
  * Khi bấm "Xác nhận", hệ thống gọi trực tiếp API `POST /api/admin/roles/{role}/reset-permissions` mà người dùng **không cần nhấn nút "Lưu cài đặt"**.
  * Sau khi reset thành công: Hiển thị Toast thông báo và tự động tải lại danh sách quyền (refetch UI).

---

## 2. Tech Stack & Thư viện Sử dụng

* **Framework:** React 19, Next.js 16 (App Router).
* **UI Components:** Shadcn UI (`Button`, `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction`, `Spinner`).
* **Icons:** Lucide React (`RotateCcw`, `Save`).
* **Data Fetching & State:** React Query (`useMutation`, `useQueryClient`).
* **Notification:** `sonner` toast.

---

## 3. Tích hợp API & React Query Hook

### 3.1 Service Call (`services/adminService.ts`)
```typescript
resetRolePermissions: async (role: string) => {
  const response = await api.post<{ message: string }>(`/admin/roles/${role}/reset-permissions`)
  return response.data
}
```

### 3.2 Custom Hook (`hooks/useAdmin.ts`)
```typescript
export function useResetRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (role: string) => adminService.resetRolePermissions(role),
    onSuccess: (_, role) => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-permissions', role] })
    },
  })
}
```

---

## 4. Đặc tả Giao diện & Xử lý Trạng thái (`app/admin/(dashboard)/roles/page.tsx`)

### 4.1 UI Layout Header
* **Vị trí**: Nằm ở góc phải header cùng dòng với tiêu đề "Phân quyền Động".
* **Nút bấm**:
  * Biến thể: `variant="outline"`
  * Icon: `<RotateCcw className="mr-2 h-4 w-4" />`
  * Nhãn: `"Khôi phục mặc định"`
  * Trạng thái disabled: Khi đang thực hiện request reset hoặc khi dữ liệu đang tải.

### 4.2 Confirm Dialog (`AlertDialog`)
* **Tiêu đề:** Khôi phục phân quyền mặc định?
* **Nội dung:** Hành động này sẽ đặt lại tất cả các quyền của nhóm **[Giáo viên / Học sinh]** về cấu hình chuẩn ban đầu. Bạn có chắc chắn muốn thực hiện?
* **Nút Hủy:** `"Hủy bỏ"`
* **Nút Đồng ý:** `"Xác nhận khôi phục"`
  * Hiển thị trạng thái loading spinner khi request đang được xử lý.

---

## 5. Xử lý Lỗi & Cập nhật Dữ liệu (Error Handling & Cache Invalidation)

1. **Thành công:**
   * Hiển thị Toast thành công: `Khôi phục cài đặt quyền mặc định cho nhóm [ROLE] thành công!`
   * Tự động refetch `useRolePermissions(selectedRole)` để đồng bộ công tắc (Switches) trên màn hình.
2. **Thất bại:**
   * Hiển thị Toast lỗi: `Có lỗi xảy ra khi khôi phục quyền mặc định.`
