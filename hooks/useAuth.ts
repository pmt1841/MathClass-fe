'use client'

import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { logoutSuccess } from '@/lib/redux/features/authSlice'
import api from '@/lib/axios'

export function useAuth() {
  const user = useAppSelector((state) => state.auth.user)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const isInitializing = useAppSelector((state) => state.auth.isInitializing)
  const dispatch = useAppDispatch()
  const router = useRouter()

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      console.error('Logout error', e)
    }
    if (typeof document !== 'undefined') {
      document.cookie = 'mathclass_role=; path=/; max-age=0; SameSite=Lax'
    }
    dispatch(logoutSuccess())
    router.push('/')
  }

  return { user, isAuthenticated, isInitializing, logout }
}
