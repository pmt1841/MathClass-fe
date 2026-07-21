'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { DashboardHeader } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardFooter } from '@/components/layout/footer'
import { Users, Shield, FileText, Database } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const adminNavItems = [
  {
    icon: Users,
    label: 'Quản lý Người dùng',
    href: '/admin/users',
  },
  {
    icon: Shield,
    label: 'Quản lý quyền hạn',
    href: '/admin/roles',
  },
  {
    icon: FileText,
    label: 'Nhật ký hệ thống',
    href: '/admin/logs',
  },
  {
    icon: Database,
    label: 'Kho bài tập cộng đồng',
    href: '/admin/community-repo',
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isInitializing } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (isInitializing) return

    if (!isAuthenticated) {
      router.replace('/')
      return
    }

    if (user) {
      if (user.role === 'ADMIN' || user.userRole === 'ADMIN') {
        setIsAuthorized(true)
      } else {
        setIsAuthorized(false)
        router.replace('/home')
      }
    }
  }, [isInitializing, isAuthenticated, user, router])

  if (isInitializing || !isAuthenticated || isAuthorized === null) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/30 animate-pulse">
        {/* Header skeleton */}
        <div className="h-16 shrink-0 bg-background border-b" />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar skeleton */}
          <div className="w-64 shrink-0 bg-background border-r" />

          {/* Content skeleton */}
          <div className="flex-1 p-8 space-y-4">
            <div className="h-8 w-56 bg-muted rounded-md" />
            <div className="h-10 w-96 bg-muted rounded-md" />
            <div className="h-64 bg-muted rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthorized) return null

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <DashboardHeader />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar customNavItems={adminNavItems} />

        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>

      <DashboardFooter />
    </div>
  )
}
