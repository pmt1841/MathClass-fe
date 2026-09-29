'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService, LoginCredentials, LoginResponse } from '@/services/authService'
import { AUTH_KEYS, ROLES } from '@/lib/constants/auth'
import { AxiosError } from 'axios'
import { useAppDispatch } from '@/lib/redux/hooks'
import { setAuth } from '@/lib/redux/features/authSlice'
import { useQueryClient } from '@tanstack/react-query'
import { authStorage } from '@/lib/auth-storage'
import { logoutSession } from '@/lib/logout'
import { setLocaleCookie } from '@/lib/constants/i18n'

export interface TwoFactorState {
  is2faRequired: boolean
  isSetupRequired: boolean
  preAuthToken: string
  message: string
  email: string
  rememberMe: boolean
}

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const router = useRouter()
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()

  const completeLoginSession = (data: LoginResponse, rememberMe: boolean = false) => {
    const role = data.role || data.userRole || ROLES.STUDENT

    // Xóa cache các query của tài khoản trước đó (nếu có)
    queryClient.clear()

    // Cập nhật authStorage (lọc bỏ token trước khi lưu vào cookie user_info)
    authStorage.setToken('', role, rememberMe)
    authStorage.setUserInfo(data, rememberMe)

    // Cập nhật Redux Store
    dispatch(
      setAuth({
        id: data.id || 0,
        email: data.email || '',
        fullName: data.fullName || '',
        role: role,
        avatarUrl: data.avatarUrl,
        permissions: data.permissions,
      })
    )

    // Lưu cookie mathclass_role và mathclass_remember cho middleware nhận diện vai trò tức thì,
    // đồng thời xóa sạch cookie mathclass_logged_out nếu còn sót lại từ lần logout trước đó
    if (typeof document !== 'undefined') {
      document.cookie = 'mathclass_logged_out=; path=/; max-age=0; SameSite=Lax'
      const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 : ''
      const maxAgeStr = cookieMaxAge ? `; max-age=${cookieMaxAge}` : ''
      document.cookie = `mathclass_role=${role}; path=/${maxAgeStr}; SameSite=Lax`
      if (rememberMe) {
        document.cookie = `mathclass_remember=true; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
      } else {
        document.cookie = `mathclass_remember=; path=/; max-age=0; SameSite=Lax`
      }

      // Đồng bộ ngôn ngữ ưa thích của người dùng từ CSDL vào cookie NEXT_LOCALE
      if (data.language) {
        setLocaleCookie(data.language)
      }
    }

    if (data.email) {
      if (rememberMe) {
        localStorage.setItem(AUTH_KEYS.REMEMBERED_EMAIL, data.email)
      } else {
        localStorage.removeItem(AUTH_KEYS.REMEMBERED_EMAIL)
      }
    }

    if (role === ROLES.ADMIN) {
      router.push('/admin')
    } else {
      router.push('/home')
    }
  }

  const login = async (
    credentials: LoginCredentials,
    rememberMe: boolean,
    expectedRole?: string
  ): Promise<boolean | TwoFactorState> => {
    setIsLoading(true)
    setLoginError('')

    try {
      const data = await authService.login({ ...credentials, rememberMe })
      const role = data.role || data.userRole || ROLES.STUDENT

      if (expectedRole && role !== expectedRole) {
        await logoutSession()
        if (role === ROLES.ADMIN) {
          setLoginError(
            'Đây là tài khoản Quản trị viên. Vui lòng đăng nhập tại Cổng Quản trị hệ thống (/admin/login).'
          )
        } else if (expectedRole === ROLES.ADMIN) {
          setLoginError(
            'Tài khoản này không có quyền Quản trị viên. Vui lòng đăng nhập tại Cổng dành cho Giáo viên & Học sinh (/login).'
          )
        } else {
          setLoginError(
            'Tài khoản này không có quyền truy cập khu vực này. Vui lòng đăng nhập đúng cổng cho vai trò của bạn.'
          )
        }
        setIsLoading(false)
        return false
      }

      // Đăng nhập thành công -> xóa bỏ ngay cờ mathclass_logged_out
      if (typeof document !== 'undefined') {
        document.cookie = 'mathclass_logged_out=; path=/; max-age=0; SameSite=Lax'
      }

      // Nếu tài khoản yêu cầu xác thực cấp 2 (2FA Google Authenticator)
      if (data.is2faRequired) {
        setIsLoading(false)
        return {
          is2faRequired: true,
          isSetupRequired: !!data.isSetupRequired,
          preAuthToken: data.preAuthToken || '',
          message: data.message || '',
          email: data.email || credentials.email,
          rememberMe: !!rememberMe,
        }
      }

      completeLoginSession(data, rememberMe)
      return true
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      if (axiosError.response) {
        setLoginError(
          axiosError.response.data?.message ||
            'Email hoặc mật khẩu không đúng. Vui lòng thử lại.'
        )
      } else {
        setLoginError('Không thể kết nối máy chủ. Vui lòng thử lại sau.')
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    login,
    completeLoginSession,
    isLoading,
    loginError,
    setLoginError,
  }
}
