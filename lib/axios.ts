import axios from 'axios';
import { authStorage } from './auth-storage';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    if (typeof window === 'undefined') {
      // 2. Nếu chạy ở Server Side (Next.js Server Component)
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const token = cookieStore.get('mathclass_jwt')?.value;
        if (token) {
          config.headers.Cookie = `mathclass_jwt=${token}`;
        }
      } catch (e) {
        // Dự phòng nếu không import được next/headers
        console.error("Không thể lấy cookie ở Server side", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response) {
      const responseData = error.response.data;

      /*
       * BẮT LỖI KHÓA TÀI KHOẢN:
       * Kiểm tra nếu phản hồi từ Backend báo lỗi tài khoản bị khóa (mã ACCOUNT_LOCKED hoặc chuỗi thông báo "đã bị khóa")
       * -> Xóa dữ liệu phiên đăng nhập hiện tại và đẩy ngay về trang Đăng nhập kèm lý do "account_locked".
       */
      const isAccountLocked =
        responseData?.code === 'ACCOUNT_LOCKED' ||
        (typeof responseData?.message === 'string' && responseData.message.includes('đã bị khóa'));

      if (isAccountLocked) {
        if (typeof window !== 'undefined') {
          // Xóa sạch storage phía client
          authStorage.clearToken();
          authStorage.clearUserInfo();

          // Xóa các cookie không HttpOnly ở phía client
          document.cookie = 'mathclass_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';
          document.cookie = 'mathclass_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';
          document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';

          // Gọi API logout bất đồng bộ bằng instance axios gốc để Backend gửi Set-Cookie hủy HttpOnly Cookie mà không gây đệ quy interceptor
          axios.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/logout`, {}, { withCredentials: true }).catch(() => {});

          const isAlreadyLoginPage = window.location.pathname.includes('/login');
          if (!isAlreadyLoginPage) {
            window.location.href = '/login?reason=account_locked';
          }
        }
        return Promise.reject(error);
      }

      if (error.response.status === 401) {
        // Bỏ qua nếu lỗi 401 xuất phát từ API login hoặc chính API refresh token
        const isAuthApi = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refreshtoken');

        if (!isAuthApi && typeof window !== 'undefined' && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            // Tự động gọi API gia hạn token
            await api.post('/auth/refreshtoken');
            // Gia hạn thành công -> Gọi lại API ban đầu
            return api(originalRequest);
          } catch (refreshError) {
            // Gia hạn thất bại -> Đẩy về trang đăng nhập
            const isAlreadyLoginPage = window.location.pathname.includes('/login');
            if (!isAlreadyLoginPage) {
              authStorage.clearToken();
              if (window.location.pathname !== '/') {
                window.location.href = '/login';
              }
            }
            return Promise.reject(refreshError);
          }
        }
      } else if (error.response.status === 403) {
        const msg = 'Tính năng không khả dụng hoặc bạn không có quyền thực hiện thao tác này.';
        error.message = msg;
        if (error.response.data && typeof error.response.data === 'object') {
          error.response.data.message = msg;
        } else {
          error.response.data = { message: msg };
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('permission-revoked', { detail: { message: msg } }));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;