'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface PermissionGuardProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { user } = useAuth()

  // Admin has all permissions automatically
  const isAdmin = user?.role === 'ADMIN'
  const hasPermission = isAdmin || (user?.permissions && user.permissions.includes(permission))

  if (hasPermission) {
    return <>{children}</>
  }

  if (fallback !== undefined) {
    return <>{fallback}</>
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-block cursor-not-allowed w-full">
            <div className="pointer-events-none opacity-50 w-full">
              {children}
            </div>
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
    // Fast check if not logged in
    if (!isInitializing && !isAuthenticated) {
      router.replace('/')
      return
    }

    if (user) {
      const isAdmin = user.role === 'ADMIN' || user.userRole === 'ADMIN'
      const hasPerm = isAdmin || (user.permissions && user.permissions.includes(permission))

      if (!hasPerm) {
        toast.error('Bạn không có quyền truy cập trang này')
        router.replace(redirectUrl)
      } else {
        setIsChecking(false)
      }
    }
  }, [user, permission, router, redirectUrl])

  if (isChecking) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/50 min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
