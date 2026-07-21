# Báo cáo Đánh giá Bảo mật (Security Review Report) - MathClass-fe

Dự án: **MathClass-fe**  
Thời gian đánh giá: **20/07/2026**

Tài liệu này ghi lại kết quả đánh giá bảo mật chi tiết đối với mã nguồn frontend của dự án `MathClass-fe` (Next.js App Router) dựa trên phân tích SAST (Static Application Security Testing) và Security Audit.

---

## 1. Tóm tắt các vấn đề phát hiện (Summary of Findings)

| ID | Vấn đề bảo mật | Mức độ | Trạng thái | Vị trí phát hiện |
|---|---|---|---|---|
| **SEC-01** | Lỗ hổng XSS tiềm ẩn qua `dangerouslySetInnerHTML` | **HIGH** | 🟢 Đã sửa | `latex-toolbar.tsx`, `chart.tsx`, `tiptap.tsx` |
| **SEC-02** | Lưu trữ JWT token ở Client Storage (XSS Risk) | **HIGH** | 🟢 Đã sửa | `lib/auth-storage.ts`, `hooks/useAuth.ts` |
| **SEC-03** | Thư viện phụ thuộc chứa lỗ hổng bảo mật (lodash-es) | **HIGH** | 🟢 Đã sửa | `package.json` (@ckeditor) |
| **SEC-04** | Nguy cơ XSS Khi Sử Dụng `rehype-raw` Không Qua Sanitizer | **MEDIUM** | 🟢 Đã sửa | `submission-detail.tsx`, `inline-comment-popover.tsx` |
| **SEC-05** | Thiếu Router Middleware kiểm soát truy cập sớm | **MEDIUM** | 🟢 Đã sửa | Cấu trúc thư mục `/app/(dashboard)/*` |
| **SEC-06** | Quyền mặc định khi Fallback dễ gây rò rỉ giao diện | **LOW** | 🟢 Đã sửa | `home-client.tsx` |
| **SEC-07** | Bỏ qua lỗi biên dịch TypeScript khi Build | **LOW** | 🟢 Đã sửa | `next.config.mjs` |

---

## 2. Chi tiết kỹ thuật & Giải pháp khắc phục (Detailed Findings & Remediation)

### SEC-01: Lỗ hổng XSS tiềm ẩn qua `dangerouslySetInnerHTML`

* **Mức độ nghiêm trọng:** **HIGH**
* **Vị trí file:**
  * `components/ui/latex-toolbar.tsx` (dòng 120: `dangerouslySetInnerHTML={{ __html: html }}`)
  * `components/ui/chart.tsx` (dòng 83)
  * `components/ui/tiptap.tsx` (dòng 187)
* **Mô tả:**  
    Ứng dụng đang sử dụng thuộc tính `dangerouslySetInnerHTML` của React để chèn trực tiếp HTML (đặc biệt là biến `html` trong `latex-toolbar.tsx`). Nếu dữ liệu này có nguồn gốc từ input của người dùng và không được làm sạch (sanitize) kỹ lưỡng, kẻ tấn công có thể chèn các đoạn mã JavaScript độc hại (Cross-Site Scripting).
* **Giải pháp:**  
    Sử dụng thư viện `dompurify` để làm sạch nội dung HTML trước khi chèn vào DOM:
    ```bash
    npm install dompurify @types/dompurify
    ```
    ```tsx
    import DOMPurify from 'dompurify';
    // ...
    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    ```
* **Trạng thái khắc phục:** 🟢 **Đã sửa**

---

### SEC-02: Lưu Trữ JWT Token Ở Client Storage & Thiếu HttpOnly

* **Mức độ nghiêm trọng:** **HIGH**
* **Vị trí file:**  
  * `lib/auth-storage.ts`
  * `hooks/useAuth.ts`
* **Mô tả:**  
    Mã nguồn hiện tại lưu trữ JWT token trong `localStorage`, `sessionStorage` và thông qua `document.cookie`. Điều này vi phạm nguyên tắc bảo mật cơ bản vì mã JavaScript (bao gồm cả mã độc XSS) có thể dễ dàng đọc được token và đánh cắp phiên đăng nhập (Session Hijacking).
* **Giải pháp:**  
    Chuyển đổi hoàn toàn sang cơ chế xác thực sử dụng **HttpOnly Cookie**.
    - Frontend cần dừng việc lưu trữ token thủ công.
    - Cấu hình Axios (`withCredentials: true`) để tự động gửi cookie kèm theo mỗi request.
    - Backend phải chịu trách nhiệm set HttpOnly Cookie khi login thành công.
* **Trạng thái khắc phục:** 🟢 **Đã sửa**

---

### SEC-03: Thư viện phụ thuộc chứa lỗ hổng bảo mật (Dependencies Vulnerability)

* **Mức độ nghiêm trọng:** **HIGH**
* **Vị trí file:** `package.json` (`npm audit`)
* **Mô tả:**  
    Kiểm tra bằng lệnh `npm audit` phát hiện **68 lỗ hổng** (1 High, 64 Moderate, 3 Low). Đáng chú ý nhất là lỗ hổng Prototype Pollution và Code Injection trong thư viện `lodash-es` (phiên bản <= 4.17.23). Thư viện này được gọi gián tiếp thông qua `@ckeditor`. 
    Các lỗ hổng này có thể dẫn đến việc thực thi mã tùy ý (RCE) hoặc thao túng logic ứng dụng.
* **Giải pháp:**  
    - Cập nhật gói `@ckeditor/ckeditor5-build-classic` (hoặc các component CKEditor khác) lên phiên bản vá lỗi mới nhất (ví dụ: `39.0.2` trở lên).
    - Hoặc sử dụng trường `overrides` trong `package.json` để ép cập nhật `lodash-es` lên bản an toàn:
      ```json
      "overrides": {
        "lodash-es": "^4.17.24"
      }
      ```
    - Chạy lại `npm install` và `npm audit` để đảm bảo không còn lỗ hổng.
* **Trạng thái khắc phục:** 🟢 **Đã sửa**

---

*(Các mục SEC-04 đến SEC-07 giữ nguyên trạng thái Đã sửa từ đợt review trước)*

### SEC-04: Nguy cơ XSS Khi Sử Dụng `rehype-raw` Không Qua Sanitizer
* **Trạng thái khắc phục:** 🟢 **Đã sửa** (Bằng cách sử dụng `rehype-sanitize`).

### SEC-05: Thiếu Router Middleware Kiểm Soát Truy Cập Sớm
* **Trạng thái khắc phục:** 🟢 **Đã sửa** (Đã chuyển hướng an toàn từ server-side).

### SEC-06: Logic Fallback Quyền Mặc Định Dễ Gây Rò Rỉ Giao Diện
* **Trạng thái khắc phục:** 🟢 **Đã sửa**.

### SEC-07: Cấu Hình Bỏ Qua Lỗi TypeScript Khi Build
* **Trạng thái khắc phục:** 🟢 **Đã sửa** (Đặt `ignoreBuildErrors: false`).
