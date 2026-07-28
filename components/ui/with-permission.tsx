'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'

interface PermissionGuardProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.userRole === 'ADMIN'
  const hasPermission = isAdmin || (user?.permissions && user.permissions.includes(permission))

  if (hasPermission) return <>{children}</>
  if (fallback !== undefined) return <>{fallback}</>

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-block cursor-not-allowed w-full">
            <div className="pointer-events-none opacity-50 w-full">{children}</div>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Bạn không có quyền thực hiện thao tác này.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface RoutePermissionGuardProps {
  permission: string
  children: React.ReactNode
  redirectUrl?: string
}

export function RoutePermissionGuard({ permission, children, redirectUrl = '/home' }: RoutePermissionGuardProps) {
  const { user, isAuthenticated, isInitializing } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace('/')
      return
    }

    if (user) {
      const isAdmin = user.role === 'ADMIN' || user.userRole === 'ADMIN'
      const hasPerm = isAdmin || (user.permissions && user.permissions.includes(permission))

      if (!hasPerm) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('permission-revoked', {
              detail: { message: 'Tính năng không khả dụng. Bạn không có quyền truy cập vào khu vực này.' },
            })
          )
          if (window.history.length > 1) {
            router.back()
          } else {
            router.replace(redirectUrl)
          }
        }
      } else {
        setIsChecking(false)
      }
    }
  }, [user, permission, router, redirectUrl, isInitializing, isAuthenticated])

  if (isChecking) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/50 min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
