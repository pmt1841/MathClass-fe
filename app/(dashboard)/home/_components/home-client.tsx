'use client'

import { useEffect, useState } from 'react'
import { StudentDashboardClient } from './student-client'
import { TeacherDashboardClient } from './teacher-client'

export function HomeClient() {
  const [role, setRole] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const stored =
      localStorage.getItem('user_info') ||
      sessionStorage.getItem('user_info')
    
    if (stored) {
      try {
        const info = JSON.parse(stored)
        setRole(info.role || info.userRole || 'STUDENT')
      } catch {
        setRole('STUDENT')
      }
    } else {
      setRole('STUDENT') // Fallback
    }
    setIsChecking(false)
  }, [])

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

  return <StudentDashboardClient />
}
