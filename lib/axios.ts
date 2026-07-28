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