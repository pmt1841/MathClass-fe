# Specification: Giao diện Xác thực 2 Bước (2FA - Google Authenticator) cho Quản trị viên (`MathClass-fe`)

---

## 1. Feature Overview
- **Feature Name:** Giao diện Thiết lập và Xác thực 2 bước (2FA Google Authenticator & Backup Codes) cho Quản trị viên.
- **Target Subsystem:** `MathClass-fe` (Next.js App Router Frontend)
- **Target Users:** System Administrator (Role `ADMIN`)

---

## 2. Business Goal & Core Objectives

Cung cấp trải nghiệm đăng nhập bảo mật cấp 2 mượt mà, hiện đại và chuẩn xác cho Quản trị viên:

1. **Luồng Thiết lập Lần đầu (Onboarding Setup Wizard)**:
   - Hiển thị khi Admin đăng nhập lần đầu tiên (hoặc chưa kích hoạt 2FA).
   - Giao diện 3 bước trực quan: (1) Quét mã QR Code / Copy Secret Key $\rightarrow$ (2) Nhập mã OTP 6 số để xác nhận $\rightarrow$ (3) Lưu trữ và tải về 8 Mã dự phòng (Backup Codes).
2. **Luồng Xác thực Đăng nhập Định kỳ (Verification Flow)**:
   - Hiển thị khi Admin đã kích hoạt 2FA.
   - Giao diện nhập mã 6 số (PinInput) tự động chuyển focus, hỗ trợ paste từ clipboard.
   - Nút chuyển đổi phương thức: "Đăng nhập bằng Mã dự phòng (Backup Code)" linh hoạt.
3. **Quản lý Phiên Tạm thời (Pre-Auth State)**:
   - Lưu trữ an toàn `preAuthToken` trong React state / memory, tự động đính kèm vào header khi gọi các API `/api/v1/auth/2fa/*`.
4. **Thông báo Trực quan & Chống Thử sai**:
   - Hiển thị lỗi rõ ràng (ví dụ: mã OTP sai, số lần thử còn lại, thông báo khóa tạm 15 phút nếu bị rate-limit).

---

## 3. Potential UI/UX Loopholes & Mitigations (5 Key Edge Cases)

### 3.1. Case 1: Pre-Auth Token hết hạn trong khi đang thao tác
- **Vấn đề:** Admin dừng lại đọc hướng dẫn hoặc tìm điện thoại quá 5 phút khiến `preAuthToken` hết hạn $\rightarrow$ API trả về 401.
- **Khắc phục:** Hiển thị toast cảnh báo: *"Phiên xác thực đã hết hạn do không hoạt động. Vui lòng đăng nhập lại."* và tự động reset form về màn hình đăng nhập Email/Password.

### 3.2. Case 2: Admin bỏ qua việc lưu Mã dự phòng (Backup Codes)
- **Vấn đề:** Admin bấm nhanh bỏ qua bước lưu mã dự phòng, sau đó mất điện thoại dẫn đến mất vĩnh viễn quyền truy cập tài khoản Admin.
- **Khắc phục:** Nút *"Hoàn tất & Truy cập Quản trị"* bị **Disable**. Chỉ sáng lên khi Admin tích chọn checkbox bắt buộc: *"Tôi xác nhận đã sao chép hoặc tải về các mã dự phòng này ở nơi an toàn"*.

### 3.3. Case 3: Thao tác nhập mã OTP 6 số bất tiện
- **Vấn đề:** Người dùng phải click chuột từng ô hoặc không paste được chuỗi 6 số từ ứng dụng khác.
- **Khắc phục:** Sử dụng component `InputOTP` / `PinInput` hỗ trợ tự động nhảy sang ô kế tiếp khi gõ phím, tự lùi ô khi bấm Backspace, và tự động phân tách khi paste chuỗi 6 chữ số từ clipboard.

### 3.4. Case 4: Nhập sai mã OTP (Visual Feedback)
- **Vấn đề:** Nhập sai mã chỉ hiện text lỗi nhỏ, khó nhận biết.
- **Khắc phục:** Kích hoạt hiệu ứng rung lắc nhẹ (Shake animation) trên cụm ô nhập OTP, tự động bôi đỏ viền ô, xóa toàn bộ giá trị sai và autofocus lại ô số 1.

### 3.5. Case 5: Không có điện thoại / Mất ứng dụng Authenticator
- **Vấn đề:** Admin bị mất máy hoặc không mang điện thoại bên người.
- **Khắc phục:** Cung cấp link chuyển đổi tức thì: *"Không thể sử dụng Google Authenticator? Đăng nhập bằng Mã dự phòng"*. Khi click, chuyển sang ô nhập text mã dự phòng định dạng `XXXX-XXXX`.

---

## 4. Tech Stack & Cấu trúc Thư mục

* **Framework:** Next.js 14+ (App Router), React 19 / React 18.
* **Ngôn ngữ:** TypeScript.
* **Styling & Icons:** Tailwind CSS 4, Lucide React (`ShieldCheck`, `QrCode`, `Key`, `Copy`, `Download`, `ArrowRight`, `Lock`).
* **UI Primitives:** Radix UI Dialog / Modal, Input OTP.
* **Form & Validation:** React Hook Form + Zod.
* **State Management:** Redux Toolkit (`setAuth`), React Query.

### Cấu trúc file chi tiết:
```text
components/
└── auth/
    ├── admin-login-form.tsx         # Cập nhật: bắt cờ is2faRequired để kích hoạt flow 2FA
    ├── TwoFactorVerifyModal.tsx     # Modal/Form xác thực 6 số OTP và Backup Code
    ├── TwoFactorSetupWizard.tsx     # Wizard thiết lập QR Code + Xác nhận + Backup Codes
    └── BackupCodesViewer.tsx        # Component hiển thị danh sách 8 mã dự phòng kèm nút Copy/Download
services/
└── authService.ts                   # Bổ sung các hàm API 2FA (setup, confirm, verify)
```

---

## 5. Đặc tả Giao diện & Component Chi tiết

### 5.1. Wizard Thiết lập 2FA lần đầu (`TwoFactorSetupWizard.tsx`)
* **Bước 1: Quét mã QR Code**
  * Hiển thị ảnh QR Code rõ nét từ `qrCodeDataUrl`.
  * Khối hiển thị Secret Key dạng text (chia cụm 4 chữ cái để dễ đọc, kèm nút "Sao chép khóa").
  * Hướng dẫn 2 bước: *"1. Mở ứng dụng Google Authenticator $\rightarrow$ 2. Quét mã QR bên dưới"*.
* **Bước 2: Xác nhận Kích hoạt**
  * Cụm 6 ô nhập mã OTP dạng PinInput.
  * Nút "Xác nhận & Kích hoạt" (có loading spinner khi đang gọi API confirm).
* **Bước 3: Lưu trữ Mã dự phòng (Backup Codes)**
  * Tiêu đề cảnh báo sắc vàng/cam: *"Lưu lại các mã dự phòng của bạn"*.
  * Lưới 2 cột hiển thị 8 mã dự phòng với font `font-mono font-bold tracking-wider`.
  * Nút **"Sao chép tất cả"** (Copy vào clipboard định dạng danh sách).
  * Nút **"Tải file .txt"** (Tải file `mathclass-admin-backup-codes.txt`).
  * Checkbox cam kết bắt buộc $\rightarrow$ Nút *"Hoàn tất & Vào Dashboard"*.

---

### 5.2. Màn hình Xác thực 2FA Đăng nhập (`TwoFactorVerifyModal.tsx`)
* **Header & Icon:** Biểu tượng `ShieldCheck` màu tím chủ đạo của Math Class, tiêu đề *"Xác thực 2 bước"*.
* **Chế độ TOTP mặc định:**
  * 6 ô nhập số PinInput.
  * Tự động gọi API verify khi người dùng nhập đủ 6 chữ số.
  * Nút chuyển đổi: *"Sử dụng Mã dự phòng (Backup Code)"*.
* **Chế độ Mã dự phòng (Backup Code mode):**
  * Ô nhập text duy nhất (placeholder: `XXXX-XXXX`).
  * Nút "Xác nhận đăng nhập".
  * Nút chuyển đổi ngược lại: *"Quay lại nhập mã 6 số từ ứng dụng"*.
* **Footer:** Nút *"Hủy & Quay lại đăng nhập"*.

---

## 6. API Client Integration (`services/authService.ts`)

```typescript
export interface TwoFactorLoginResponse {
  is2faRequired?: boolean
  isSetupRequired?: boolean
  preAuthToken?: string
  message?: string
  token?: string
  [key: string]: any
}

export interface TwoFactorSetupResponse {
  secretKey: string
  qrCodeDataUrl: string
  manualEntryKey: string
}

export interface TwoFactorConfirmPayload {
  code: string
}

export interface TwoFactorVerifyPayload {
  code: string
  isBackupCode?: boolean
}

export const authService = {
  // ... các hàm hiện tại giữ nguyên ...

  // 1. Khởi tạo setup QR Code
  initiate2faSetup: async (preAuthToken: string): Promise<TwoFactorSetupResponse> => {
    const { data } = await api.post<TwoFactorSetupResponse>('/auth/2fa/setup', {}, {
      headers: { Authorization: `Bearer ${preAuthToken}` }
    })
    return data
  },

  // 2. Xác nhận kích hoạt 2FA và nhận Backup Codes
  confirm2faSetup: async (payload: TwoFactorConfirmPayload, preAuthToken: string) => {
    const { data } = await api.post('/auth/2fa/setup/confirm', payload, {
      headers: { Authorization: `Bearer ${preAuthToken}` }
    })
    return data
  },

  // 3. Xác thực OTP 2FA hoặc Backup Code khi đăng nhập
  verify2faLogin: async (payload: TwoFactorVerifyPayload, preAuthToken: string) => {
    const { data } = await api.post('/auth/2fa/verify', payload, {
      headers: { Authorization: `Bearer ${preAuthToken}` }
    })
    return data
  }
}
```

---

## 7. Acceptance Criteria Checklist

- [ ] **AC-FE-1 (Admin Login Intercept):** Khi đăng nhập Admin, nếu nhận `is2faRequired: true` và `isSetupRequired: true` $\rightarrow$ Mở `TwoFactorSetupWizard`.
- [ ] **AC-FE-2 (Verification Modal):** Nếu nhận `is2faRequired: true` và `isSetupRequired: false` $\rightarrow$ Mở `TwoFactorVerifyModal`.
- [ ] **AC-FE-3 (QR Code Rendering):** Hiển thị đúng ảnh QR Code và cho phép sao chép chuỗi Secret Key thủ công.
- [ ] **AC-FE-4 (OTP PinInput Behavior):** Nhập 6 số tự động nhảy ô, xóa tự lùi ô, paste 6 số tự động lấp đầy và submit.
- [ ] **AC-FE-5 (Backup Codes Download & Copy):** Bấm "Sao chép tất cả" copy đủ 8 mã; bấm "Tải file .txt" tải đúng nội dung file.
- [ ] **AC-FE-6 (Enforce Checkbox Confirmation):** Không cho phép hoàn tất setup nếu chưa tick xác nhận lưu mã dự phòng.
- [ ] **AC-FE-7 (Toggle Backup Code Mode):** Chuyển đổi qua lại mượt mà giữa chế độ nhập OTP 6 số và chế độ nhập Backup Code.
- [ ] **AC-FE-8 (Error Handling & Rate Limit):** Hiển thị thông báo lỗi khi nhập sai mã; hiển thị thông báo khóa 15 phút nếu nhận HTTP 429.
- [ ] **AC-FE-9 (Successful Login Redirect):** Sau khi verify thành công $\rightarrow$ Lưu thông tin xác thực vào Redux/Cookie và chuyển hướng vào `/admin`.

---

## 8. Unit & Component Test Cases Checklist

### 8.1. Component Tests (`__tests__/components/auth/2fa.test.tsx`)
- [ ] **UT-FE-01:** `TwoFactorVerifyModal_rendersCorrectPinInput()`
- [ ] **UT-FE-02:** `TwoFactorVerifyModal_paste6Digits_shouldFillAllInputsAndTriggerVerify()`
- [ ] **UT-FE-03:** `TwoFactorVerifyModal_toggleBackupCodeMode_shouldSwitchInputType()`
- [ ] **UT-FE-04:** `TwoFactorSetupWizard_step1_displaysQrCodeAndSecret()`
- [ ] **UT-FE-05:** `TwoFactorSetupWizard_step3_completeButtonDisabledUntilCheckboxChecked()`
- [ ] **UT-FE-06:** `BackupCodesViewer_copyButton_triggersClipboardWrite()`

### 8.2. E2E Tests (`e2e/admin-2fa.spec.ts`)
- [ ] **E2E-01:** Luồng Admin thiết lập 2FA lần đầu: Đăng nhập $\rightarrow$ Quét QR $\rightarrow$ Nhập OTP $\rightarrow$ Lưu Backup Codes $\rightarrow$ Vào trang `/admin`.
- [ ] **E2E-02:** Luồng Admin đăng nhập định kỳ: Đăng nhập $\rightarrow$ Nhập đúng mã 6 số $\rightarrow$ Vào trang `/admin`.
- [ ] **E2E-03:** Luồng Admin đăng nhập bằng Mã dự phòng khi mất điện thoại.

---

## 9. Implementation Checklist

- [ ] Cập nhật `services/authService.ts` với các hàm và TypeScript interfaces cho 2FA.
- [ ] Xây dựng component `TwoFactorVerifyModal.tsx` (PinInput 6 số, switch Backup code).
- [ ] Xây dựng component `TwoFactorSetupWizard.tsx` (3 bước: QR, OTP confirm, Backup codes).
- [ ] Xây dựng component `BackupCodesViewer.tsx` (lưới hiển thị mã + nút copy/download).
- [ ] Cập nhật `components/auth/admin-login-form.tsx` và `app/(auth)/login/page.tsx` để tích hợp các modals trên.
- [ ] Viết Unit Tests & E2E Tests theo mục 8.
