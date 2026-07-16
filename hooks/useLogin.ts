'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService, LoginCredentials } from '@/services/authService'
import { AUTH_KEYS, COOKIE_OPTIONS, ROLES } from '@/lib/constants/auth'
import { authStorage } from '@/lib/auth-storage'
import { AxiosError } from 'axios'

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const router = useRouter()

  const login = async (credentials: LoginCredentials, rememberMe: boolean) => {
    setIsLoading(true)
    setLoginError('')

    try {
      const data = await authService.login(credentials)
      const token = data.token
      const role = data.role || data.userRole || ROLES.STUDENT

      // Setup cookies and storage using authStorage
      authStorage.setToken(token, role, rememberMe)

      // Save user info to cookie for consistent session behavior
      authStorage.setUserInfo(data, rememberMe)

      if (rememberMe) {
        localStorage.setItem(AUTH_KEYS.REMEMBERED_EMAIL, credentials.email)
      } else {
        localStorage.removeItem(AUTH_KEYS.REMEMBERED_EMAIL)
      }

      router.refresh()
      if (role === ROLES.ADMIN) {
        router.push('/admin/users')
      } else {
        router.push('/home')
      }

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
