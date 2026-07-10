# Báo cáo Đánh giá Hiệu năng (Performance Review Report) - Trang `/home`

Dự án: **MathClass-fe**  
Thời gian đánh giá: **10/07/2026**

Dưới đây là kết quả rà soát hiệu năng chi tiết cho khu vực Dashboard (`/home`) và đề xuất tối ưu hóa.

---

## 1. Tóm tắt các vấn đề phát hiện (Summary of Findings)

| ID | Vấn đề hiệu năng | Mức độ | Trạng thái | Vị trí phát hiện |
|---|---|---|---|---|
| **PERF-01** | Tải thừa bundle của cả hai Dashboard (Student & Teacher) | **HIGH** | 🟢 Đã tối ưu | `home-client.tsx` |
| **PERF-02** | Re-render và tính toán lọc dữ liệu lặp lại khi tìm kiếm | **MEDIUM** | 🟢 Đã tối ưu | `TeacherDashboardClient` |
| **PERF-03** | Chiến lược fetch dữ liệu lặp lại liên tục (Stale Time mặc định = 0) | **LOW** | 🟢 Đã tối ưu | `student-client.tsx`, `teacher-client.tsx` |

---

## 2. Chi tiết kỹ thuật & Giải pháp khắc phục (Detailed Findings & Remediation)

### PERF-01: Tải thừa bundle của cả hai Dashboard
*   **Mức độ nghiêm trọng:** **HIGH**
*   **Vị trí file:** [home-client.tsx](file:///Users/luanpv/Desktop/MathClass-fe/app/(dashboard)/home/_components/home-client.tsx)
*   **Mô tả:**  
    `HomeClient` đang nạp tĩnh cả hai component giao diện:
    ```typescript
    import { StudentDashboardClient } from './student-client'
    import { TeacherDashboardClient } from './teacher-client'
    ```
    Mỗi file này có kích thước khá lớn (13KB và 17KB thô chưa nén), chứa nhiều thư viện con. Việc tải cả hai file này khiến một học sinh phải tải code giao diện của giáo viên và ngược lại, làm tăng dung lượng bundle ban đầu của trang `/home` không cần thiết.
*   **Giải pháp:**  
    Sử dụng hàm `dynamic` của Next.js để lazy-load component Dashboard theo role thực tế:
    ```typescript
    import dynamic from 'next/dynamic'

    const StudentDashboardClient = dynamic(
      () => import('./student-client').then(mod => mod.StudentDashboardClient),
      { loading: () => <div className="p-8 text-center">Đang tải giao diện...</div> }
    )

    const TeacherDashboardClient = dynamic(
      () => import('./teacher-client').then(mod => mod.TeacherDashboardClient),
      { loading: () => <div className="p-8 text-center">Đang tải giao diện...</div> }
    )
    ```
*   **Trạng thái tối ưu:** 🟢 **Đã tối ưu**. Đã chuyển đổi sang `next/dynamic` kết hợp component `DashboardSkeleton` để trì hoãn việc tải và biên dịch Dashboard cho đến khi xác định chính xác vai trò của người dùng.

---

### PERF-02: Re-render và tính toán lọc dữ liệu lặp lại khi tìm kiếm (Form Input Lag)
*   **Mức độ nghiêm trọng:** **MEDIUM**
*   **Vị trí file:** [teacher-client.tsx](file:///Users/luanpv/Desktop/MathClass-fe/app/(dashboard)/home/_components/teacher-client.tsx#L58-L64)
*   **Mô tả:**  
    Danh sách bài nộp chờ chấm được lọc theo lớp và tìm kiếm theo tên học sinh/bài tập. Phép toán lọc `.filter()` được thực thi lại trên mỗi ký tự người dùng gõ vào ô tìm kiếm, gây ra tình trạng giật/trễ (input lag) làm giảm chỉ số INP.
*   **Giải pháp:**  
    Bọc logic lọc này trong `useMemo` để chỉ tính toán lại khi dữ liệu nguồn hoặc tham số tìm kiếm thay đổi:
    ```typescript
    const filteredAssignments = React.useMemo(() => {
      return pendingSubmissionData.filter((a: any) => {
        const matchesClass = selectedClass === 'all' || a.classCode === selectedClass
        const matchesSearch = searchQuery === '' ||
          a.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.assignmentTitle?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesClass && matchesSearch
      })
    }, [pendingSubmissionData, selectedClass, searchQuery])
    ```
*   **Trạng thái tối ưu:** 🟢 **Đã tối ưu**. Đã bọc logic lọc trong `useMemo` phụ thuộc vào `pendingSubmissionData`, `selectedClass`, và `searchQuery`, loại bỏ hoàn toàn việc tính toán lại không cần thiết khi gõ phím.

---

### PERF-03: Tránh Fetch dữ liệu thừa với Stale Time = 0
*   **Mức độ nghiêm trọng:** **LOW**
*   **Vị trí file:** 
    *   [student-client.tsx](file:///Users/luanpv/Desktop/MathClass-fe/app/(dashboard)/home/_components/student-client.tsx#L24-L37)
    *   [teacher-client.tsx](file:///Users/luanpv/Desktop/MathClass-fe/app/(dashboard)/home/_components/teacher-client.tsx#L34-L55)
*   **Mô tả:**  
    Cả hai dashboard đều sử dụng React Query (`useQuery`) mà không thiết lập `staleTime` (mặc định = 0). Mỗi khi người dùng chuyển tab trình duyệt rồi quay lại, hoặc chuyển trang rồi quay lại trang `/home`, React Query sẽ tự động gọi lại toàn bộ các API. Dữ liệu tổng quan này thực tế không thay đổi liên tục từng giây, do đó gây lãng phí tài nguyên.
*   **Giải pháp:**  
    Thiết lập một lượng `staleTime` hợp lý (ví dụ: 1 đến 5 phút) cho các truy vấn tổng quan này:
    ```typescript
    const { data: stats, isLoading } = useQuery({
      queryKey: ['teacher-stats'],
      queryFn: dashboardApi.getTeacherStats,
      staleTime: 2 * 60 * 1000, // Cân nhắc dữ liệu mới sau mỗi 2 phút
    })
    ```
*   **Trạng thái tối ưu:** 🟢 **Đã tối ưu**. Đã áp dụng cấu hình `staleTime: 2 * 60 * 1000` (2 phút) cho tất cả các truy vấn dữ liệu tổng quan trên cả Dashboard Học sinh và Dashboard Giáo viên.
