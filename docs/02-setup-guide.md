# Hướng Dẫn Cài Đặt Môi Trường (Frontend Setup Guide)

## 1. Yêu cầu (Prerequisites)

- **Node.js**: Phiên bản >= 18.17.0
- **npm** hoặc **yarn**
- **IDE:** Visual Studio Code (Khuyên dùng)
- Cài đặt extension: **ESLint**, **Prettier**, **Tailwind CSS IntelliSense** cho VS Code.

## 2. Cấu hình Môi trường (.env)

Tại thư mục gốc của frontend (`MathClass-fe/`), tạo một file `.env.local` (hoặc `.env`):

```env
# Địa chỉ API của backend local
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Địa chỉ kết nối WebSocket / STOMP
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws

# Google OAuth2 Client ID (Dành cho đăng nhập bằng Google)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Cấu hình tuỳ chọn kiểm thử / phân tích
# NEXT_PUBLIC_ENABLE_MSW=false
```

## 3. Cài đặt thư viện & Chạy dự án (Running)

Mở terminal tại thư mục `MathClass-fe/`:

### Cài đặt dependencies

```bash
npm install
```

### Khởi chạy môi trường phát triển (Dev server)

```bash
npm run dev
```

Server sẽ khởi động tại **<http://localhost:3000>**. Mở trình duyệt và trải nghiệm!

## 4. Kiểm tra

Hãy đảm bảo bạn đã khởi động Backend (`MathClass-service`) ở port 8080 để Frontend có thể giao tiếp (thử đăng nhập hoặc đăng ký tài khoản mới).

Tiếp theo, hãy tham khảo [Hướng dẫn Frontend (Frontend Guide)](03-frontend-guide.md) để biết cấu trúc code và quy chuẩn viết.
