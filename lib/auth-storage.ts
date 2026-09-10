import { AUTH_KEYS, COOKIE_OPTIONS } from '@/lib/constants/auth'

export const authStorage = {
  getToken(): string | null {
    // We no longer retrieve the token from JS storage.
    // The token is handled automatically by the browser via HttpOnly cookies.
    return null
  },

  setToken(token: string, role: string, rememberMe: boolean) {
    if (typeof window === 'undefined') return

    // Token is now set by the backend via HttpOnly Cookie.
    // We only save the user role and persistence preference.
    const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
    const roleCookieBase = `user_role=${role}; path=${COOKIE_OPTIONS.PATH}; SameSite=${COOKIE_OPTIONS.SAME_SITE}${secureFlag}`

    if (rememberMe) {
      document.cookie = `${roleCookieBase}; max-age=${COOKIE_OPTIONS.MAX_AGE}`
      document.cookie = `mathclass_remember=true; path=/; max-age=${COOKIE_OPTIONS.MAX_AGE}; SameSite=${COOKIE_OPTIONS.SAME_SITE}${secureFlag}`
      localStorage.setItem('auth_persistence', 'persistent')
    } else {
      document.cookie = roleCookieBase
      document.cookie = `mathclass_remember=; path=/; max-age=0; SameSite=${COOKIE_OPTIONS.SAME_SITE}${secureFlag}`
      localStorage.setItem('auth_persistence', 'session')
    }

    // Clear old storage to prevent stale data
    localStorage.removeItem(AUTH_KEYS.TOKEN)
    sessionStorage.removeItem(AUTH_KEYS.TOKEN)
  },

  isValidSession(): boolean {
    if (typeof window === 'undefined') return true
    // Phiên đăng nhập hợp lệ khi vẫn còn Cookie user_info hoặc mathclass_role
    const hasUserInfoCookie = !!this.getCookie(AUTH_KEYS.USER_INFO)
    const hasRoleCookie = !!this.getCookie('user_role') || !!this.getCookie('mathclass_role')
    return hasUserInfoCookie || hasRoleCookie
  },

  /**
   * Xóa toàn bộ cookie liên quan tới phiên đăng nhập.
   * Lưu ý: `mathclass_jwt` là cookie HttpOnly do Backend set — JS không thể xóa trực tiếp,
   * cookie này chỉ thực sự bị hủy khi Backend nhận được request logout (Set-Cookie hết hạn).
   */
  clearSessionCookies() {
    if (typeof window === 'undefined') return
    document.cookie = 'user_role=; path=/; max-age=0'
    document.cookie = 'mathclass_role=; path=/; max-age=0'
    document.cookie = 'mathclass_jwt=; path=/; max-age=0'
    document.cookie = 'mathclass_remember=; path=/; max-age=0'
    document.cookie = `${AUTH_KEYS.USER_INFO}=; path=/; max-age=0`
    document.cookie = 'mathclass_logged_out=1; path=/; max-age=10'
  },

  /**
   * Lọc bỏ các trường nhạy cảm (token, password...) trước khi lưu vào cookie `user_info`
   * để tránh phơi bày JWT qua cookie không HttpOnly (phòng thủ XSS).
   */
  sanitizeUserInfo(userInfo: any): any {
    if (!userInfo || typeof userInfo !== 'object') return userInfo
    const { token, accessToken, refreshToken, idToken, password, ...safe } = userInfo
    return safe
  },

  clearToken() {
    if (typeof window === 'undefined') return
    this.clearSessionCookies()
    localStorage.removeItem(AUTH_KEYS.TOKEN)
    sessionStorage.removeItem(AUTH_KEYS.TOKEN)
    localStorage.removeItem('auth_persistence')
  },

  setUserInfo(userInfo: any, rememberMe: boolean) {
    if (typeof window === 'undefined') return

    const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
    const encodedData = encodeURIComponent(JSON.stringify(this.sanitizeUserInfo(userInfo)))
    const cookieBase = `${AUTH_KEYS.USER_INFO}=${encodedData}; path=${COOKIE_OPTIONS.PATH}; SameSite=${COOKIE_OPTIONS.SAME_SITE}${secureFlag}`

    if (rememberMe) {
      document.cookie = `${cookieBase}; max-age=${COOKIE_OPTIONS.MAX_AGE}`
    } else {
      document.cookie = cookieBase
    }

    // Clear old storages to ensure strict adherence to cookies
    localStorage.removeItem(AUTH_KEYS.USER_INFO)
    sessionStorage.removeItem(AUTH_KEYS.USER_INFO)
  },

  getUserInfo(): any | null {
    if (typeof window === 'undefined') return null

    // Check tab session persistence
    if (!this.isValidSession()) {
      return null
    }

    const cookieData = this.getCookie(AUTH_KEYS.USER_INFO)
    if (cookieData) {
      try {
        return JSON.parse(decodeURIComponent(cookieData))
      } catch (e) {
        console.error('Error parsing user_info cookie', e)
        return null
      }
    }
    const localData = localStorage.getItem(AUTH_KEYS.USER_INFO)
    if (localData) {
      try {
        return JSON.parse(localData)
      } catch (e) {
        return null
      }
    }
    return null
  },

  clearUserInfo() {
    if (typeof window === 'undefined') return
    document.cookie = `${AUTH_KEYS.USER_INFO}=; path=/; max-age=0`
    localStorage.removeItem(AUTH_KEYS.USER_INFO)
    sessionStorage.removeItem(AUTH_KEYS.USER_INFO)
  },

  getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }
}
