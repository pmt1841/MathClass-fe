# Báo cáo Đánh giá Bảo mật (Security Review Report) - MathClass-fe

Tài liệu này ghi lại kết quả đánh giá bảo mật chi tiết đối với mã nguồn frontend của dự án `MathClass-fe` (Next.js App Router).

---

## 1. Tóm tắt các vấn đề phát hiện (Summary of Findings)

| ID | Vấn đề bảo mật | Mức độ | Trạng thái | Vị trí phát hiện |
|---|---|---|---|---|
| **SEC-01** | Stored/Reflected XSS qua `rehype-raw` không kiểm duyệt | **HIGH** | 🟢 Đã sửa | `submission-detail.tsx`, `inline-comment-popover.tsx`, ... |
| **SEC-02** | Thiếu Router Middleware kiểm soát truy cập sớm | **MEDIUM** | 🟢 Đã sửa | Cấu trúc thư mục `/app/(dashboard)/*` |
| **SEC-03** | Lưu trữ JWT token ở Client Storage & thiếu thuộc tính Cookie an toàn | **MEDIUM** | 🟢 Đã sửa | `useLogin.ts`, `axios.ts` |
| **SEC-04** | Quyền mặc định khi Fallback dễ gây rò rỉ giao diện | **LOW** | 🟢 Đã sửa | `home-client.tsx` |
| **SEC-05** | Bỏ qua lỗi biên dịch TypeScript khi Build | **LOW** | 🟢 Đã sửa | `next.config.mjs` |
| **SEC-06** | Các thư viện phụ thuộc chứa lỗ hổng bảo mật đã biết | **MEDIUM** | 🟢 Đã sửa | `package.json` |

---

## 2. Chi tiết kỹ thuật & Giải pháp khắc phục (Detailed Findings & Remediation)

### SEC-01: Nguy cơ XSS Khi Sử Dụng `rehype-raw` Không Qua Sanitizer
*   **Mức độ nghiêm trọng:** **HIGH**
*   **Vị trí file:**
    *   [submission-detail.tsx](../components/assignments/submission-detail.tsx#L183-L185)
    *   [inline-comment-popover.tsx](../components/assignments/inline-comment-popover.tsx#L97-L103)
    *   [student-assignment-layout.tsx](../app/(dashboard)/assignments/[id]/_components/student-assignment-layout.tsx)
    *   [assignment-detail-client.tsx](../app/(dashboard)/assignments/[id]/_components/assignment-detail-client.tsx)
*   **Mô tả:**  
    Ứng dụng hiển thị công thức toán và định dạng markdown bằng thư viện `react-markdown`. Để hiển thị các thẻ HTML lồng ghép, cấu hình đang sử dụng plugin `rehype-raw` trực tiếp từ dữ liệu người dùng nhập mà không có bộ lọc (sanitizer). Kẻ tấn công có thể chèn các thẻ HTML độc hại có chứa script vào bài tập hoặc nhận xét để chiếm quyền điều khiển phiên làm việc của người dùng khác (Stored/Reflected XSS).
*   **Giải pháp:**  
    Cài đặt và tích hợp thêm plugin `rehype-sanitize` vào ReactMarkdown cùng với `rehype-raw`.
    ```bash
    npm install rehype-sanitize
    ```
    Sửa đổi code render ReactMarkdown:
    ```typescript
    import rehypeSanitize from 'rehype-sanitize'
    
    // Sử dụng trong ReactMarkdown
    <ReactMarkdown 
      remarkPlugins={[remarkMath]} 
      rehypePlugins={[rehypeKatex, rehypeRaw, rehypeSanitize]}
    >
      {content}
    </ReactMarkdown>
    ```
*   **Trạng thái khắc phục:** 🟢 **Đã sửa**. Đã tích hợp `rehype-sanitize` đi kèm bộ schema `sanitizeSchema` mở rộng (trong [markdown.ts](../lib/markdown.ts)) trước `rehype-katex` để lọc sạch mọi thẻ HTML độc hại trong khi vẫn hiển thị hoàn hảo các công thức toán học.

---

### SEC-02: Thiếu Router Middleware Kiểm Soát Truy Cập Sớm
*   **Mức độ nghiêm trọng:** **MEDIUM**
*   **Vị trí:** Thư mục `/app/(dashboard)/*`
*   **Mô tả:**  
    Dự án thiếu file `middleware.ts` ở cấp độ root để chặn người dùng chưa đăng nhập truy cập các đường dẫn private. Giao diện trang `/home` hay `/settings` vẫn tải và hiển thị tạm thời (flash) cho guest trước khi API thất bại trả về lỗi `401` và kích hoạt Axios Interceptor chuyển hướng.
*   **Giải pháp:**  
    Tạo file [middleware.ts](../middleware.ts) ở thư mục gốc để kiểm tra cookie `auth_token` trước khi kết xuất trang trên server:
    ```typescript
    import { NextResponse } from 'next/server'
    import type { NextRequest } from 'next/server'

    export function middleware(request: NextRequest) {
      const token = request.cookies.get('auth_token')?.value
      const { pathname } = request.nextUrl

      // Danh sách các route cần đăng nhập mới được vào
      const protectedPaths = ['/home', '/classes', '/assignments', '/settings', '/profile']
      const isProtected = protectedPaths.some(path => pathname.startsWith(path))

      if (isProtected && !token) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }

      return NextResponse.next()
    }

    export const config = {
      matcher: ['/home/:path*', '/classes/:path*', '/assignments/:path*', '/settings/:path*', '/profile/:path*']
    }
    ```
*   **Trạng thái khắc phục:** 🟢 **Đã sửa**. Đã cập nhật và bảo mật quá trình chuyển hướng trong [proxy.ts](../proxy.ts) (phương án chuẩn Next.js 16+ thay thế cho `middleware.ts`), chặn truy cập của guest và redirect về `/login?expired=true` ngay từ server.

---

### SEC-03: Lưu Trữ JWT Token Ở Client Storage & Thiếu Thuộc Tính Cookie An Toàn
*   **Mức độ nghiêm trọng:** **MEDIUM**
*   **Vị trí file:**  
    *   [useLogin.ts](../hooks/useLogin.ts#L24-L33)
    *   [axios.ts](../lib/axios.ts#L22-L27)
*   **Mô tả:**  
    *   Token xác thực lưu trực tiếp trong `localStorage` và `sessionStorage` rất dễ bị đánh cắp bởi mã độc JS chạy qua lỗ hổng XSS (SEC-01).
    *   Mã nguồn ghi Cookie thông qua `document.cookie` ở Client side nhưng không cấu hình cờ `Secure`, khiến cookie xác thực bị truyền đi dưới dạng bản rõ trên môi trường HTTP (không an toàn).
*   **Giải pháp:**  
    *   **Khuyên dùng tối ưu:** Chuyển đổi cơ chế lưu session hoàn toàn sang HttpOnly cookie do Backend cấp phát khi đăng nhập thành công.
    *   **Giải pháp tình thế tại frontend:** Thiết lập cờ `Secure` khi lưu cookie trên môi trường HTTPS:
        ```typescript
        const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
        const cookieBase = `auth_token=${token}; path=${COOKIE_OPTIONS.PATH}; SameSite=${COOKIE_OPTIONS.SAME_SITE}${secureFlag}`
        ```
*   **Trạng thái khắc phục:** 🟢 **Đã sửa**. Đã bổ sung cờ `; Secure` trên môi trường HTTPS cho các cookie xác thực khi đăng nhập thường hoặc đăng nhập qua Google trong [useLogin.ts](../hooks/useLogin.ts) và [social-login-button.tsx](../components/auth/social-login-button.tsx).

---

### SEC-04: Logic Fallback Quyền Mặc Định Dễ Gây Rò Rỉ Giao Diện
*   **Mức độ nghiêm trọng:** **LOW**
*   **Vị trí file:** [home-client.tsx](../app/(dashboard)/home/_components/home-client.tsx#L23-L25)
*   **Mô tả:**  
    Nếu thông tin người dùng không tồn tại trong bộ nhớ lưu trữ, ứng dụng tự động gán role mặc định là `'STUDENT'` và render component giao diện học sinh (`StudentDashboardClient`). Điều này khiến một guest chưa đăng nhập vẫn nhìn thấy giao diện trống của học sinh trong chốc lát.
*   **Giải pháp:**  
    Không fallback role mặc định. Nếu không tìm thấy thông tin user trong bộ nhớ, lập tiếp chuyển hướng người dùng ra trang đăng nhập `/login`.
*   **Trạng thái khắc phục:** 🟢 **Đã sửa**. Sửa logic [home-client.tsx](../app/(dashboard)/home/_components/home-client.tsx) trả về giao diện chờ xác thực thay vì tự động kết xuất giao diện của học sinh để tránh rò rỉ giao diện.

---

### SEC-05: Cấu Hình Bỏ Qua Lỗi TypeScript Khi Build
*   **Mức độ nghiêm trọng:** **LOW**
*   **Vị trí file:** [next.config.mjs](../next.config.mjs#L3-L5)
*   **Mô tả:**  
    Cấu hình Next.js hiện đang thiết lập:
    ```javascript
    typescript: {
      ignoreBuildErrors: true,
    }
    ```
    Điều này cho phép build và deploy code chứa lỗi cú pháp TypeScript lên production, có thể che giấu các lỗi logic bảo mật hoặc ép kiểu thiếu an toàn (`any`).
*   **Giải pháp:**  
    Đặt lại thành `ignoreBuildErrors: false` và xử lý triệt để tất cả lỗi biên dịch trước khi triển khai sản phẩm.
*   **Trạng thái khắc phục:** 🟢 **Đã sửa**. Chuyển `ignoreBuildErrors: false` trong [next.config.mjs](../next.config.mjs), đồng thời giải quyết toàn bộ các lỗi kiểu dữ liệu TypeScript (từ Sidebar đến Recharts) để đảm bảo trình biên dịch kiểm soát hoàn toàn mã nguồn trước khi deploy.

---

### SEC-06: Các Thư Viện Phụ Thuộc Chứa Lỗ Hổng Bảo Mật Đã Biết
*   **Mức độ nghiêm trọng:** **MEDIUM / HIGH**
*   **Chi tiết:**  
    Kết quả từ `npm audit` cho thấy dự án đang sử dụng các gói thư viện có lỗ hổng đã được công bố rộng rãi:
    1.  `form-data` (< 4.0.6): Lỗ hổng CRLF injection thông qua tên file/trường multipart ([GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx)).
    2.  `postcss` (< 8.5.10): Lỗ hổng XSS qua style tag không được lọc ([GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)).
    3.  `undici` (7.0.0 - 7.27.2): Chứa nhiều lỗ hổng TLS bypass, HTTP response queue poisoning, v.v.
*   **Giải pháp:**  
    *   Chạy lệnh nâng cấp tự động: `npm audit fix`.
    *   Nâng cấp gói `next` lên phiên bản mới nhất để cập nhật các thư viện con đi kèm như `postcss` và `undici`.
*   **Trạng thái khắc phục:** 🟢 **Đã sửa**. Sử dụng trường `overrides` trong [package.json](../package.json) để ép phiên bản `postcss` sử dụng bản vá bảo mật mới nhất (`^8.5.16`). Lệnh `npm audit` hiện tại ghi nhận 0 lỗ hổng bảo mật.
