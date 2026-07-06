import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

api.interceptors.request.use(
  async (config) => {
    let token: string | undefined = undefined;

    if (typeof window !== 'undefined') {
      // 1. Nếu chạy ở trình duyệt (Client Side)
      token =
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('auth_token') ||
        getCookie('auth_token');
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
    if (error.response && error.response.status === 401) {
      // Prevent intercepting login requests which naturally return 401 on wrong credentials
      const isLoginApi = error.config && error.config.url && error.config.url.includes('/auth/login');
      
      if (!isLoginApi && typeof window !== 'undefined') {
        const isAlreadyLoginPage = window.location.pathname.includes('/login');
        
        if (!isAlreadyLoginPage) {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
          document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;