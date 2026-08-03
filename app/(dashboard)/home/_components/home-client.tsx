'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

import { useAuth } from '@/hooks/useAuth'

const DashboardSkeleton = () => (
  <div className="flex-1 flex items-center justify-center bg-slate-50/50">
    <div className="text-center">
      <p className="text-slate-500 mb-2 text-sm">Đang tải giao diện...</p>
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
    </div>
  </div>
)

const StudentDashboardClient = dynamic(
  () => import('./student-client').then(mod => mod.StudentDashboardClient),
  { loading: () => <DashboardSkeleton /> }
)

const TeacherDashboardClient = dynamic(
  () => import('./teacher-client').then(mod => mod.TeacherDashboardClient),
  { loading: () => <DashboardSkeleton /> }
)

export function HomeClient() {
  const router = useRouter()
  const { user, isAuthenticated, isInitializing } = useAuth()

  useEffect(() => {
    if (isInitializing) return
    
    if (!isAuthenticated) {
      router.replace('/')
      return
    }

    const role = user?.role || (user as any)?.userRole
    if (role === 'ADMIN') {
      router.replace('/admin/users')
    }
  }, [isAuthenticated, isInitializing, user, router])

  if (isInitializing || !isAuthenticated || !user) {
    return <DashboardSkeleton />
  }

  const role = user.role || user.userRole;

  if (role === 'TEACHER') {
    return <TeacherDashboardClient />
  }

  if (role === 'STUDENT') {
    return <StudentDashboardClient />
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50/50">
      <div className="text-center">
        <p className="text-slate-500 mb-2 text-sm">Đang xác thực thông tin...</p>
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )
}
