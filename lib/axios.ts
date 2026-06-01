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

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;