# Spec: Cập nhật và Khắc phục Lỗ hổng Bảo mật Frontend (Security Hardening)

## Objective

Khắc phục triệt để các lỗ hổng bảo mật (XSS, Session Hijacking, Dependencies) đã được phát hiện trong tài liệu [security_review.md](../review/security_review.md), nhằm đảm bảo:

1. Ngăn chặn triệt để lỗ hổng Cross-Site Scripting (XSS) khi render các HTML tag và nội dung định dạng phức tạp.
2. Xóa bỏ hoàn toàn nguy cơ rò rỉ JWT Token thông qua Client Storage, chuyển sang cơ chế xác thực an toàn bằng HttpOnly Cookie.
3. Loại bỏ các lỗ hổng bảo mật (CVE) đã biết từ các thư viện phụ thuộc (Dependencies).

---

## Tech Stack

* Không thay đổi kiến trúc chính (Next.js App Router, React, Axios).
* **Thêm mới:** Thư viện `dompurify` và `@types/dompurify` để sanitize mã HTML ở client-side.

---

## Commands

* Cài đặt thư viện và dependencies mới: `npm install`
* Kiểm tra lỗ hổng thư viện: `npm audit`
* Chạy server frontend cục bộ: `npm run dev`

---

## Project Structure & Proposed Changes

Các thay đổi sẽ được áp dụng trực tiếp lên các tệp nguồn sau của dự án `MathClass-fe`:

### 1. Khắc phục XSS tiềm ẩn (`dangerouslySetInnerHTML`)

#### [MODIFY] [package.json](../package.json)

* Thêm `dompurify` vào dependencies và `@types/dompurify` vào devDependencies để phục vụ việc làm sạch HTML:

    ```bash
    npm install dompurify
    npm install -D @types/dompurify
    ```

#### [MODIFY] [components/ui/latex-toolbar.tsx](../components/ui/latex-toolbar.tsx)

* Import `DOMPurify` từ `dompurify`.
* Tìm dòng `dangerouslySetInnerHTML={{ __html: html }}` và thay thế bằng việc sanitize biến `html` trước khi render:

    ```tsx
    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    ```

#### [MODIFY] [components/ui/chart.tsx](../components/ui/chart.tsx) và [components/ui/tiptap.tsx](../components/ui/tiptap.tsx)

* Thực hiện tương tự: Bọc bất kỳ dữ liệu động nào được truyền vào `dangerouslySetInnerHTML` bằng `DOMPurify.sanitize(...)`.

---

### 2. Chuyển đổi Cơ chế Xác thực (JWT Storage)

*Lưu ý: Phần này yêu cầu Backend đã cấu hình trả về HttpOnly Cookie chứa JWT.*

#### [MODIFY] [lib/auth-storage.ts](../lib/auth-storage.ts)

* **Xóa toàn bộ** logic lưu trữ token (`AUTH_KEYS.TOKEN`) vào `localStorage`, `sessionStorage`, và `document.cookie`.
* Giữ lại các logic lưu trữ tùy chọn không nhạy cảm nếu cần, nhưng tuyệt đối không lưu token.
* Hàm `getToken()` nên được loại bỏ hoặc sửa đổi để chỉ trả về null, vì token hiện đang nằm trong HttpOnly Cookie mà JS không thể đọc được.

#### [MODIFY] [hooks/useAuth.ts](../hooks/useAuth.ts)

* Cập nhật logic khởi tạo Auth State. Thay vì kiểm tra token trong `localStorage`, hãy gọi một API như `/api/auth/me` để Backend kiểm chứng tính hợp lệ của HttpOnly Cookie và trả về thông tin user.

#### [MODIFY] [lib/axios.ts](../lib/axios.ts)

* Cấu hình mặc định để Axios luôn gửi kèm cookie chéo domain (nếu API khác port/domain):

    ```typescript
    const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        withCredentials: true, // QUAN TRỌNG
    });
    ```

* **Xóa bỏ** đoạn Axios Request Interceptor đang làm nhiệm vụ tự động đính kèm header `Authorization: Bearer <token>`, vì trình duyệt sẽ tự lo việc đính kèm cookie.

---

### 3. Khắc phục Lỗ hổng Thư viện (Dependencies Vulnerability)

#### [MODIFY] [package.json](../package.json)

* Lỗ hổng từ `lodash-es` chủ yếu đi qua `@ckeditor/ckeditor5-*`. Dùng tính năng `overrides` (hoặc `resolutions` nếu dùng Yarn) để ép toàn bộ các package con sử dụng phiên bản `lodash-es` an toàn (>= `4.17.24`).
* Bổ sung/cập nhật đoạn mã sau vào cấu hình `package.json`:

    ```json
    "overrides": {
      "lodash-es": "^4.17.24",
      "postcss": "^8.5.16"
    }
    ```

---

## Code Style

* Sử dụng thư viện chuẩn (`DOMPurify`) thay vì tự viết Regex để làm sạch HTML nhằm tránh rủi ro bỏ sót các bypass phức tạp.

---

## Testing Strategy

Bổ sung các kịch bản kiểm thử bảo mật thủ công hoặc tự động (E2E Tests):

### 1. Kiểm thử Cross-Site Scripting (XSS)

* **Test Case 1:** Nhập đoạn mã HTML/JavaScript độc hại: `<img src=x onerror=alert('XSS')>` hoặc `<svg onload=alert(1)>` vào CKEditor hoặc bảng công thức Toán học.
* **Kỳ vọng:** Khi render, thẻ script hoặc các thuộc tính event (`onload`, `onerror`) bị loại bỏ hoàn toàn. Hộp thoại alert không bật lên.

### 2. Kiểm thử Session Hijacking & HttpOnly

* **Test Case 2:** Người dùng đăng nhập thành công. Mở DevTools > tab Application (hoặc Storage).
* **Kỳ vọng:**
  * Không thấy JWT token nào lưu trong Local Storage hoặc Session Storage.
  * Trong mục Cookies, thấy tồn tại một cookie chứa token với cờ **HttpOnly** và **Secure** được bật (dấu tick).
* **Test Case 3:** Mở tab Console, gõ `document.cookie`.
* **Kỳ vọng:** Không thấy token xuất hiện trong chuỗi kết quả (chứng minh JS không thể đọc được).

### 3. Kiểm thử API Axios (Credentials)

* **Test Case 4:** Người dùng sau khi đăng nhập, tiến hành chuyển hướng sang trang `/classes` (có fetch API lấy danh sách lớp).
* **Kỳ vọng:** API fetch thành công (HTTP 200), payload Request Headers trong Network tab hiển thị `Cookie: auth_token=...` được trình duyệt tự động đính kèm.

### 4. Kiểm thử Dependency Vulnerabilities

* **Test Case 5:** Chạy lệnh `npm audit`.
* **Kỳ vọng:** Không tìm thấy lỗ hổng nào mức độ HIGH hoặc CRITICAL liên quan đến `lodash-es` hoặc các packet khác.

---

## Success Criteria

* [ ] Toàn bộ các vị trí dùng `dangerouslySetInnerHTML` đều được wrap bằng `DOMPurify`.
* [ ] Ứng dụng Frontend không còn xử lý thủ công JWT token (đọc/lưu/xóa) trong Storage.
* [ ] Các thao tác gọi API Backend vẫn hoạt động bình thường nhờ cơ chế `withCredentials`.
* [ ] Chạy `npm audit` báo cáo 0 lỗ hổng nghiêm trọng (0 vulnerabilities found for HIGH/CRITICAL).
* [ ] Quá trình build dự án (bằng `npm run build`) thành công, không gặp lỗi lint hay type mismatch.
