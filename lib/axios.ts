import axios from 'axios';
import { authStorage } from './auth-storage';
import { LOCALE_COOKIE, DEFAULT_LOCALE, getLocaleCookie } from './constants/i18n';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
// Kiểm tra xem URL đã có tiền tố version (/v1, /v2,...) chưa. Nếu chưa có sẽ tự động chèn /v1
export const baseURL = /\/v\d+$/.test(rawApiUrl)
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, '')}/v1`;

const api = axios.create({
  baseURL,
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
        const locale = cookieStore.get(LOCALE_COOKIE.NAME)?.value || DEFAULT_LOCALE;
        config.headers['Accept-Language'] = locale;
      } catch (e) {
        // Dự phòng nếu không import được next/headers
        console.error("Không thể lấy cookie ở Server side", e);
      }
    } else {
      // 1. Nếu chạy ở Client Side
      config.headers['Accept-Language'] = getLocaleCookie();
    }
    return config;
  },
  (error) => Promise.reject(error)
);


let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

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
          authStorage.clearSessionCookies();

          // Lưu vết thông tin lý do bị khóa và thời điểm khóa để Modal ở Login hiển thị
          if (responseData?.lockReason || responseData?.lockedAt) {
            try {
              sessionStorage.setItem(
                'locked_account_info',
                JSON.stringify({
                  lockReason: responseData?.lockReason,
                  lockedAt: responseData?.lockedAt,
                })
              )
            } catch (e) {
              // ignore
            }
          }

          // Gọi API logout bất đồng bộ bằng instance axios gốc để Backend gửi Set-Cookie hủy HttpOnly Cookie mà không gây đệ quy interceptor.
          // Lưu ý: phải dùng baseURL (đã tự chèn /v1) — nếu nối từ NEXT_PUBLIC_API_URL trực tiếp sẽ thiếu /v1 và bị 404.
          axios.post(`${baseURL}/auth/logout`, {}, { withCredentials: true }).catch(() => { });

          const isAdminPath = window.location.pathname.startsWith('/admin');
          const isAlreadyLoginPage = window.location.pathname.includes('/login');
          if (!isAlreadyLoginPage) {
            window.location.href = isAdminPath ? '/admin/login?reason=account_locked' : '/login?reason=account_locked';
          }
        }

        return Promise.reject(error);
      }

      if (error.response.status === 401) {
        // Bỏ qua nếu lỗi 401 xuất phát từ API login, refresh token hoặc logout.
        // Đặc biệt quan trọng với /auth/logout: nếu để refresh-token can thiệp, Backend có thể
        // cấp lại cookie HttpOnly mathclass_jwt khiến phiên "sống lại" sau khi đăng xuất
        // (biểu hiện: logout xong vào /admin/users vẫn tự động đăng nhập).
        const isAuthApi =
          originalRequest?.url?.includes('/auth/login') ||
          originalRequest?.url?.includes('/auth/refresh-token') ||
          originalRequest?.url?.includes('/auth/logout');

        if (!isAuthApi && typeof window !== 'undefined') {
          if (isRefreshing) {
            // Nếu đang trong quá trình refresh token từ 1 request khác, cho request này vào hàng đợi (Queue)
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then(() => api(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          if (!originalRequest._retry) {
            originalRequest._retry = true;
            isRefreshing = true;

            try {
              // Tự động gọi API gia hạn token (chỉ 1 request chạy thực tế)
              await api.post('/auth/refresh-token');
              // Thông báo cho tất cả các request trong hàng đợi rằng refresh token đã thành công
              processQueue(null);
              // Gia hạn thành công -> Gọi lại API ban đầu
              return api(originalRequest);
            } catch (refreshError) {
              // Thông báo thất bại cho các request trong hàng đợi
              processQueue(refreshError);
              // Gia hạn thất bại -> Đẩy về trang đăng nhập tương ứng
              const isAuthPage =
                window.location.pathname.includes('/login') ||
                window.location.pathname.includes('/signup') ||
                window.location.pathname.includes('/reset-password') ||
                window.location.pathname.includes('/verify');
              if (!isAuthPage && window.location.pathname !== '/') {
                authStorage.clearToken();
                authStorage.clearUserInfo();
                const isAdmin = window.location.pathname.startsWith('/admin');
                window.location.href = isAdmin ? '/admin/login' : '/login';
              }
              return Promise.reject(refreshError);
            } finally {
              isRefreshing = false;
            }
          }
        }
      } else if (error.response.status === 403) {
        const isAuthApi =
          originalRequest?.url?.includes('/auth/') ||
          originalRequest?.url?.includes('/users/me');
        const isAuthPage = typeof window !== 'undefined' && (
          window.location.pathname.includes('/login') ||
          window.location.pathname.includes('/signup') ||
          window.location.pathname.includes('/reset-password')
        );

        const msg = 'Tính năng không khả dụng hoặc bạn không có quyền thực hiện thao tác này.';
        error.message = msg;
        if (error.response.data && typeof error.response.data === 'object') {
          error.response.data.message = msg;
        } else {
          error.response.data = { message: msg };
        }

        if (!isAuthApi && !isAuthPage && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('permission-revoked', { detail: { message: msg } }));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;