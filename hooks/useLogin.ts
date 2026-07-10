'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, LoginCredentials } from '@/lib/api/auth'
import { AUTH_KEYS, COOKIE_OPTIONS, ROLES } from '@/lib/constants/auth'
import { AxiosError } from 'axios'

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const router = useRouter()

  const login = async (credentials: LoginCredentials, rememberMe: boolean) => {
    setIsLoading(true)
    setLoginError('')

    try {
      const data = await authApi.login(credentials)
      const token = data.token
      const role = data.role || data.userRole || ROLES.STUDENT

      // Setup cookies for middleware
      const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
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
      localStorage.removeItem(AUTH_KEYS.USER_INFO)
      sessionStorage.removeItem(AUTH_KEYS.TOKEN)
      sessionStorage.removeItem(AUTH_KEYS.USER_INFO)

      // Save to appropriate storage for client-side use
      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem(AUTH_KEYS.TOKEN, token)
      storage.setItem(AUTH_KEYS.USER_INFO, JSON.stringify(data))

      if (rememberMe) {
        localStorage.setItem(AUTH_KEYS.REMEMBERED_EMAIL, credentials.email)
      } else {
        localStorage.removeItem(AUTH_KEYS.REMEMBERED_EMAIL)
      }

      router.push('/home')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      if (axiosError.response) {
        setLoginError(axiosError.response.data?.message || 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
      } else {
        setLoginError('Không thể kết nối máy chủ. Vui lòng thử lại sau.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    login,
    isLoading,
    loginError,
  }
}
