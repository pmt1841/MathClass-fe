'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, BookMarked } from 'lucide-react'

export default function AssignmentsPage() {
  const [userRole, setUserRole] = useState<string>('STUDENT')

  useEffect(() => {
    const stored = sessionStorage.getItem('user_info') || localStorage.getItem('user_info')
    if (stored) {
      try {
        const info = JSON.parse(stored)
        setUserRole(info.role || info.userRole || 'STUDENT')
      } catch { }
    }
  }, [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-xl px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BookMarked className="h-5.5 w-5.5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Bài tập</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý danh sách bài tập của bạn.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {userRole === 'TEACHER' && (
              <Link
                href="/assignments/create"
                className="flex items-center gap-2 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-98"
              >
                <Plus className="h-4.5 w-4.5" />
                Tạo bài tập mới
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl">📝</div>
          <p className="text-muted-foreground">Tính năng danh sách bài tập đang được hoàn thiện...</p>
        </div>
      </div>
    </div>
  )
}
