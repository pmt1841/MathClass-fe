'use client'

import { useContext } from 'react'
import { ReactReduxContext } from 'react-redux'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { logoutSuccess } from '@/lib/redux/features/authSlice'
import { useQueryClient } from '@tanstack/react-query'
import { authStorage } from '@/lib/auth-storage'
import { logoutSession } from '@/lib/logout'

function useReduxAuth(queryClient: any, router: any) {
  const user = useAppSelector((state) => state.auth.user)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const isInitializing = useAppSelector((state) => state.auth.isInitializing)
  const dispatch = useAppDispatch()

  const logout = async () => {
    // 1. Xóa ngay state phía client để UI thoát đăng nhập tức thời
    if (typeof window !== 'undefined') {
      authStorage.clearToken()
      authStorage.clearUserInfo()
    }
    if (queryClient) {
      queryClient.clear()
    }
    dispatch(logoutSuccess())

    // 2. Gọi logout backend bằng axios gốc để xóa HttpOnly cookie mathclass_jwt
    await logoutSession()

    // 3. Về trang chủ
    router.push('/')
  }

  const currentUser = user || (typeof window !== 'undefined' ? authStorage.getUserInfo() : null)
  return { user: currentUser, isAuthenticated, isInitializing, logout }
}

export function useAuth() {
  const reduxContext = useContext(ReactReduxContext)
  const router = useRouter()
  let queryClient: any = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    queryClient = useQueryClient()
  } catch (e) {
    // Catch when QueryClientProvider is missing in lightweight tests
  }

  if (reduxContext) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useReduxAuth(queryClient, router)
  }

  const fallbackUser = typeof window !== 'undefined' ? authStorage.getUserInfo() : null
  return {
    user: fallbackUser,
    isAuthenticated: !!fallbackUser,
    isInitializing: false,
    logout: async () => {
      if (typeof window !== 'undefined') {
        authStorage.clearToken()
        authStorage.clearUserInfo()
      }
      if (queryClient) {
        queryClient.clear()
      }
      await logoutSession()
    },
  }
}


