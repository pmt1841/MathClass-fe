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
      const data = await authService.login(credentials)
      const role = data.role || data.userRole || ROLES.STUDENT

      if (expectedRole && role !== expectedRole) {
        await api.post('/auth/logout').catch(() => {})
        setLoginError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
        setIsLoading(false)
        return
      }

      // Xóa cache các query của tài khoản trước đó (nếu có)
      queryClient.clear()

      // Cập nhật Redux Store
      dispatch(setAuth({
        ...data,
        id: data.id || 0,
        email: data.email || credentials.email,
        fullName: data.fullName || '',
        role: role
      }))

      // Lưu cookie mathclass_role cho middleware nhận diện vai trò tức thì
      if (typeof document !== 'undefined') {
        document.cookie = `mathclass_role=${role}; path=/; max-age=86400; SameSite=Lax`
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
