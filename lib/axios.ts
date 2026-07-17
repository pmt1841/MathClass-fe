import axios from 'axios';
import { authStorage } from './auth-storage';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    let token: string | undefined = undefined;

    if (typeof window !== 'undefined') {
      // 1. Nếu chạy ở trình duyệt (Client Side)
      token = authStorage.getToken() || undefined;
    } else {
      // 2. Nếu chạy ở Server Side (Next.js Server Component)
      try {
        const { cookies } = await import('next/headers');
        token = (await cookies()).get('auth_token')?.value;
      } catch (e) {
        // Dự phòng nếu không import được next/headers
        console.error("Không thể lấy cookie ở Server side", e);
      }
    }

    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Prevent intercepting login requests which naturally return 401 on wrong credentials
        const isLoginApi = error.config && error.config.url && error.config.url.includes('/auth/login');
        
        if (!isLoginApi && typeof window !== 'undefined') {
          const isAlreadyLoginPage = window.location.pathname.includes('/login');
          
          if (!isAlreadyLoginPage) {
            authStorage.clearToken();
            window.location.href = '/';
          }
        }
      } else if (error.response.status === 403) {
        const msg = 'Bạn không có quyền thực hiện thao tác này.';
        error.message = msg;
        if (error.response.data && typeof error.response.data === 'object') {
          error.response.data.message = msg;
        } else {
          error.response.data = { message: msg };
        }
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-refresh-request'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;