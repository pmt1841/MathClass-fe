'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authStorage } from '@/lib/auth-storage'

export interface UserInfo {
  id?: number
  fullName?: string
  email?: string
  role?: string
  userRole?: string
  avatarUrl?: string
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const router = useRouter()

  useEffect(() => {
    // If the session token has expired or the session cookie was cleared (e.g. browser closed),
    // we should not use any stale user_info remaining in cookies/storage.
    if (!authStorage.getToken()) {
      authStorage.clearUserInfo()
      setUser(null)
      return
    }

    const storedUser = authStorage.getUserInfo()
    
    if (storedUser) {
      try {
        // Ensure standard role field exists
        if (storedUser.userRole && !storedUser.role) {
          storedUser.role = storedUser.userRole
        }
        setUser(storedUser)
      } catch (e) {
        console.error('Error processing user_info', e)
      }
    }
  }, [])

  const logout = () => {
    // Clear cookies and storage using authStorage
    authStorage.clearToken()
    authStorage.clearUserInfo()
    
    setUser(null)
    router.push('/')
  }

  return { user, logout }
}
