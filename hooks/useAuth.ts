'use client'

import { useState, useEffect } from 'react'

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

  return { user }
}
