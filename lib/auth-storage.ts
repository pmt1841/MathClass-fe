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
      localStorage.setItem('auth_persistence', 'persistent')
    } else {
      document.cookie = roleCookieBase
      localStorage.setItem('auth_persistence', 'session')
      sessionStorage.setItem('tab_session_active', 'true')
    }

    // Clear old storage to prevent stale data
    localStorage.removeItem(AUTH_KEYS.TOKEN)
    sessionStorage.removeItem(AUTH_KEYS.TOKEN)
  },

  clearToken() {
    if (typeof window === 'undefined') return
    document.cookie = 'user_role=; path=/; max-age=0'
    localStorage.removeItem(AUTH_KEYS.TOKEN)
    sessionStorage.removeItem(AUTH_KEYS.TOKEN)
    localStorage.removeItem('auth_persistence')
    sessionStorage.removeItem('tab_session_active')
  },

  setUserInfo(userInfo: any, rememberMe: boolean) {
    if (typeof window === 'undefined') return

    const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
    const encodedData = encodeURIComponent(JSON.stringify(userInfo))
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
    const isSession = localStorage.getItem('auth_persistence') === 'session'
    if (isSession && !sessionStorage.getItem('tab_session_active')) {
      // Tab was closed or this is a new tab, but login wasn't remembered
      this.clearToken()
      this.clearUserInfo()
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
    // Fallback cleanup (optional, left just in case)
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
