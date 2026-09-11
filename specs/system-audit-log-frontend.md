# Specification: System Audit Log Frontend (`MathClass-fe`)

## 1. Executive Summary & Objectives

Giao diện Nhật ký Hệ thống (System Audit Log UI) dành cho Quản trị viên trên **MathClass-fe** cho phép xem, lọc, phân trang và xem chi tiết các nhật ký thao tác dữ liệu (CRUD) và nhật ký sự cố hệ thống.

---

## 2. Component Specifications

### 2.1. Page Route & Location
- **File:** [app/admin/(dashboard)/logs/page.tsx](file:///d:/tien/codegym/Module_6/MathClass/MathClass-fe/app/admin/(dashboard)/logs/page.tsx)
- **Hook:** `useAdminLogs` trong [hooks/useAdmin.ts](file:///d:/tien/codegym/Module_6/MathClass/MathClass-fe/hooks/useAdmin.ts)

---

### 2.2. Filter Bar (Thanh bộ lọc)
Giao diện thanh bộ lọc đầu trang bao gồm:
1. **Lọc theo Cấp độ (`level`):**
   - Options: `Tất cả mức độ` (ALL), `INFO`, `WARNING`, `ERROR`.
2. **Lọc theo Danh mục (`resourceType`):**
   - Options: `Tất cả danh mục` (ALL), `USER`, `ROLE`, `COMMUNITY_REPO`, `SYSTEM`.
3. **Lọc theo Khoảng thời gian:**
   - Input Date `Từ ngày` (`startDate` format `YYYY-MM-DDT00:00:00`).
   - Input Date `Đến ngày` (`endDate` format `YYYY-MM-DDT23:59:59`).
4. **Nút "Xóa bộ lọc":** Reset toàn bộ trạng thái bộ lọc về mặc định và chuyển về trang 1 (`page = 0`).

---

### 2.3. Data Table (Bảng hiển thị Nhật ký)
Bảng dữ liệu Shadcn UI (`Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`):
- **Cột ID:** Hiển thị ID log.
- **Cột Thời gian:** Format ngày giờ Việt Nam (`DD/MM/YYYY HH:mm:ss`).
- **Cột Cấp độ:** Badge màu sắc:
  - `INFO`: Badge màu xanh dương (`bg-blue-500`).
  - `WARNING`: Badge màu cam (`bg-amber-500`).
  - `ERROR`: Badge màu đỏ Destructive.
- **Cột Danh mục (Resource):** Badge nhẹ phân loại (`USER`, `ROLE`, `COMMUNITY_REPO`, `SYSTEM`).
- **Cột Actor:** Email tài khoản thực hiện thao tác.
- **Cột Mô tả hành động:** Nội dung mô tả ngắn thao tác.
- **Cột IP Address:** Địa chỉ IP của Client.
- **Cột Trạng thái:** Badge `SUCCESS` (Xanh) / `FAILED` (Đỏ).

---

### 2.4. Detail Modal (Popup Xem Chi tiết Log)
- Khi click vào một dòng nhật ký, hiển thị `Dialog` chi tiết:
  - Full Actor & Role.
  - Resource Type & Resource ID.
  - Client IP & Full User-Agent (Hệ điều hành / Trình duyệt).
  - Tóm tắt chi tiết lỗi hoặc lý do thất bại (nếu `status == FAILED`).

---

### 2.5. Pagination (Phân trang)
- Hiển thị tổng số trang `Trang X / Y`.
- Nút `Trang trước` và `Trang sau` tự động disable ở trang đầu và trang cuối.

---

## 3. Data Flow & React Query Hook (`useAdminLogs`)

```typescript
export const useAdminLogs = (
  page: number,
  level?: string,
  resourceType?: string,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ['admin-logs', page, level, resourceType, startDate, endDate],
    queryFn: () => fetchAdminLogs(page, level, resourceType, startDate, endDate),
  })
}
```

---

## 4. Verification & Testing
1. **Filter Test:** Chọn từng loại bộ lọc và kiểm tra query gửi lên backend đúng param.
2. **Modal Test:** Click dòng log kiểm tra hiển thị đầy đủ User-Agent và IP Address.
3. **Pagination Test:** Chuyển qua lại các trang dữ liệu mượt mà.
