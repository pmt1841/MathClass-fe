'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authStorage } from '@/lib/auth-storage'
import { profileService } from '@/services/profileService'

let globalProfilePromise: Promise<any> | null = null;

export interface UserInfo {
  id?: number
  fullName?: string
  email?: string
  role?: string
  userRole?: string
  avatarUrl?: string
  permissions?: string[]
  active?: boolean
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = () => {
      if (!globalProfilePromise) {
        globalProfilePromise = profileService.getProfile().then((profile) => {
          const storedUser = authStorage.getUserInfo() || {} as UserInfo
          const updatedUser = {
            ...storedUser,
            ...profile,
            role: profile.role || storedUser.role
          }
          const isPersistent = localStorage.getItem('auth_persistence') === 'persistent'
          authStorage.setUserInfo(updatedUser, isPersistent)
          window.dispatchEvent(new Event('auth-updated'))
          return updatedUser
        }).catch(e => {
          console.error('Background refresh failed', e)
        }).finally(() => {
          globalProfilePromise = null;
        })
      }

      globalProfilePromise.then((updatedUser) => {
        if (updatedUser) setUser(updatedUser)
      })
    }

    const handleRefreshRequest = () => {
      fetchProfile()
    }

    const handleAuthUpdated = () => {
      const storedUser = authStorage.getUserInfo()
      if (storedUser) setUser(storedUser)
    }

    if (!authStorage.getToken()) {
      authStorage.clearUserInfo()
      setUser(null)
      return
    }

    const storedUser = authStorage.getUserInfo()
    
    if (storedUser) {
      try {
        if (storedUser.userRole && !storedUser.role) {
          storedUser.role = storedUser.userRole
        }
        setUser(storedUser)
        fetchProfile()
      } catch (e) {
        console.error('Error processing user_info', e)
      }
    }

    window.addEventListener('auth-refresh-request', handleRefreshRequest)
    window.addEventListener('auth-updated', handleAuthUpdated)
    return () => {
      window.removeEventListener('auth-refresh-request', handleRefreshRequest)
      window.removeEventListener('auth-updated', handleAuthUpdated)
    }
  }, [])

  const logout = () => {
    // Clear cookies and storage using authStorage
    authStorage.clearToken()
    authStorage.clearUserInfo()
    
    setUser(null)
    window.location.href = '/'
  }

  return { user, logout }
}
