import { AUTH_KEYS, COOKIE_OPTIONS } from '@/lib/constants/auth'

export const authStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return (
      localStorage.getItem(AUTH_KEYS.TOKEN) ||
      sessionStorage.getItem(AUTH_KEYS.TOKEN) ||
      this.getCookie(AUTH_KEYS.TOKEN) ||
      null
    )
  },

  setToken(token: string, role: string, rememberMe: boolean) {
    if (typeof window === 'undefined') return

    const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
    const cookieBase = `auth_token=${token}; path=${COOKIE_OPTIONS.PATH}; SameSite=${COOKIE_OPTIONS.SAME_SITE}${secureFlag}`
    const roleCookieBase = `user_role=${role}; path=${COOKIE_OPTIONS.PATH}; SameSite=${COOKIE_OPTIONS.SAME_SITE}${secureFlag}`

    if (rememberMe) {
      document.cookie = `${cookieBase}; max-age=${COOKIE_OPTIONS.MAX_AGE}`
      document.cookie = `${roleCookieBase}; max-age=${COOKIE_OPTIONS.MAX_AGE}`
    } else {
      document.cookie = cookieBase
      document.cookie = roleCookieBase
    }

    // Clear old storage to prevent stale data
    localStorage.removeItem(AUTH_KEYS.TOKEN)
    sessionStorage.removeItem(AUTH_KEYS.TOKEN)

    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem(AUTH_KEYS.TOKEN, token)
  },

  clearToken() {
    if (typeof window === 'undefined') return
    document.cookie = 'auth_token=; path=/; max-age=0'
    document.cookie = 'user_role=; path=/; max-age=0'
    localStorage.removeItem(AUTH_KEYS.TOKEN)
    sessionStorage.removeItem(AUTH_KEYS.TOKEN)
  },

  getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }
}
