'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
    const stored =
      sessionStorage.getItem('user_info') ||
      localStorage.getItem('user_info')
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Ensure standard role field exists
        if (parsed.userRole && !parsed.role) {
          parsed.role = parsed.userRole
        }
        setUser(parsed)
      } catch (e) {
        console.error('Error parsing user_info', e)
      }
    }
  }, [])

  const logout = () => {
    // Clear cookies
    document.cookie = 'auth_token=; path=/; max-age=0'
    document.cookie = 'user_role=; path=/; max-age=0'
    // Clear storage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('user_info')
    
    setUser(null)
    router.push('/')
  }

  return { user, logout }
}
