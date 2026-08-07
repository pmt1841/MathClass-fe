'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService, LoginCredentials } from '@/services/authService'
import { AUTH_KEYS, ROLES } from '@/lib/constants/auth'
import { AxiosError } from 'axios'
import { useAppDispatch } from '@/lib/redux/hooks'
import { setAuth } from '@/lib/redux/features/authSlice'
import api from '@/lib/axios'
import { useQueryClient } from '@tanstack/react-query'
import { authStorage } from '@/lib/auth-storage'

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const router = useRouter()
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()

  const login = async (credentials: LoginCredentials, rememberMe: boolean, expectedRole?: string) => {
    setIsLoading(true)
    setLoginError('')

    try {
      // Bổ sung role từ trang hiện tại nếu frontend đã gửi (để tương thích backend mới)
      // Hiện tại ta để mặc định role lấy từ response hoặc có thể pass role vào credentials.
      const data = await authService.login({ ...credentials, rememberMe })
      const role = data.role || data.userRole || ROLES.STUDENT

      if (expectedRole && role !== expectedRole) {
        await api.post('/auth/logout').catch(() => {})
        setLoginError('Tài khoản này không có quyền truy cập khu vực này. Vui lòng đăng nhập đúng cổng cho vai trò của bạn.')
        setIsLoading(false)
        return
      }

      // Xóa cache các query của tài khoản trước đó (nếu có)
      queryClient.clear()

      // Cập nhật authStorage (sanitizeUserInfo sẽ lọc bỏ token trước khi lưu vào cookie user_info)
      authStorage.setToken('', role, rememberMe)
      authStorage.setUserInfo(data, rememberMe)

      // Cập nhật Redux Store — chỉ chọn các field cần thiết, KHÔNG spread toàn bộ response (tránh lưu token)
      dispatch(setAuth({
        id: data.id || 0,
        email: data.email || credentials.email,
        fullName: data.fullName || '',
        role: role,
        avatarUrl: data.avatarUrl,
        permissions: data.permissions,
      }))

      // Lưu cookie mathclass_role và mathclass_remember cho middleware nhận diện vai trò tức thì
      if (typeof document !== 'undefined') {
        const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 : ''
        const maxAgeStr = cookieMaxAge ? `; max-age=${cookieMaxAge}` : ''
        document.cookie = `mathclass_role=${role}; path=/${maxAgeStr}; SameSite=Lax`
        if (rememberMe) {
          document.cookie = `mathclass_remember=true; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
        } else {
          document.cookie = `mathclass_remember=; path=/; max-age=0; SameSite=Lax`
        }
      }

      if (rememberMe) {
        localStorage.setItem(AUTH_KEYS.REMEMBERED_EMAIL, credentials.email)
      } else {
        localStorage.removeItem(AUTH_KEYS.REMEMBERED_EMAIL)
      }

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
