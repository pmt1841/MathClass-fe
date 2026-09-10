import axios from 'axios'
import { baseURL } from './axios'

/**
 * Gọi API logout bằng axios GỐC (không đi qua interceptor của instance `api`).
 *
 * Lý do bắt buộc phải dùng axios gốc:
 * - Cookie `mathclass_jwt` là HttpOnly — JS không xóa được, chỉ Backend mới xóa qua `Set-Cookie`
 *   trong response của `/auth/logout`.
 * - Nếu dùng instance `api` (có interceptor), một lỗi 401 từ `/auth/logout` sẽ bị interceptor
 *   bắt và gọi `/auth/refresh-token` → Backend có thể cấp lại cookie mới khiến phiên "sống lại"
 *   sau khi đăng xuất (bug: logout xong vẫn vào được /admin/users).
 * - Dùng axios gốc + `withCredentials: true` giúp `Set-Cookie` xóa cookie luôn được trình duyệt
 *   áp dụng mà không bị can thiệp.
 *
 * Hàm không bao giờ throw — lỗi mạng/logout chỉ được log lại để không làm gián đoạn
 * luồng xóa session phía client.
 */
export async function logoutSession(): Promise<void> {
  try {
    await axios.post(`${baseURL}/auth/logout`, {}, { withCredentials: true })
  } catch (e) {
    console.error('Logout error', e)
  } finally {
    if (typeof document !== 'undefined') {
      document.cookie = 'user_role=; path=/; max-age=0'
      document.cookie = 'mathclass_role=; path=/; max-age=0'
      document.cookie = 'user_info=; path=/; max-age=0'
      document.cookie = 'mathclass_remember=; path=/; max-age=0'
      document.cookie = 'mathclass_logged_out=1; path=/; max-age=10'
    }
  }
}
