'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

import { authStorage } from '@/lib/auth-storage'

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
  const [role, setRole] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const info = authStorage.getUserInfo()
    if (info) {
      setRole(info.role || info.userRole || null)
    } else {
      setRole(null)
      router.replace('/')
      return
    }
    setIsChecking(false)
  }, [router])

  if (isChecking) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/50">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

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
