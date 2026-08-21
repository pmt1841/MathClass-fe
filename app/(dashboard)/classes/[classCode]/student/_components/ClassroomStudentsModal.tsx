'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Users, Search, Loader2 } from 'lucide-react'
import { classroomService } from '@/services/classroomService'
import { Student } from '@/types'

interface ClassroomStudentsModalProps {
  isOpen: boolean
  onClose: () => void
  classCode: string
  totalCount?: number
}

export function ClassroomStudentsModal({
  isOpen,
  onClose,
  classCode,
  totalCount = 0,
}: ClassroomStudentsModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'online'>('all')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    if (!isOpen || !classCode) return

    const fetchStudents = async () => {
      try {
        setLoading(true)
        setError(null)
        // Retrieve up to 100 students for the modal list
        const res = await classroomService.getClassroomStudents(classCode, {
          page: 0,
          size: 100,
          sort: 'lastActiveAt,desc',
        })
        const studentList: Student[] = res?.content || res || []

        // Fallback sorting: Ensure Online users are at the top
        const sortedList = [...studentList].sort((a, b) => {
          if (a.isOnline === b.isOnline) {
            return a.fullName.localeCompare(b.fullName)
          }
          return a.isOnline ? -1 : 1
        })

        setStudents(sortedList)
      } catch (err: any) {
        console.error('Lỗi khi tải danh sách học sinh:', err)
        setError('Không thể tải danh sách học sinh. Vui lòng thử lại sau.')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [isOpen, classCode])

  const onlineCount = students.filter((s) => s.isOnline).length

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.fullName
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())

    if (activeTab === 'online') {
      return matchesSearch && student.isOnline
    }
    return matchesSearch
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border rounded-2xl shadow-xl bg-white">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-slate-50/80 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100/70 text-indigo-600 shadow-sm">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Danh sách học sinh
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Lớp học hiện tại có {totalCount || students.length} thành viên
                </DialogDescription>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {onlineCount} Online
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Tất cả ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('online')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all duration-200 ${
                activeTab === 'online'
                  ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Chỉ Online ({onlineCount})
            </button>
          </div>
        </DialogHeader>

        {/* Search input (if list is long) */}
        {students.length > 5 && (
          <div className="px-6 pt-3 pb-1 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm học sinh theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>
        )}

        {/* Student List */}
        <div className="p-4 max-h-[380px] overflow-y-auto space-y-1.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs font-medium">Đang tải danh sách học sinh...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 px-4">
              <p className="text-xs text-red-500 font-semibold">{error}</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Users className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">
                {activeTab === 'online'
                  ? 'Không có học sinh nào đang trực tuyến'
                  : searchQuery
                  ? 'Không tìm thấy học sinh phù hợp'
                  : 'Chưa có học sinh trong lớp'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'online'
                  ? 'Các bạn cùng lớp hiện đang ngoại tuyến.'
                  : searchQuery
                  ? 'Thử thay đổi từ khóa tìm kiếm.'
                  : 'Danh sách sẽ được cập nhật khi có học sinh tham gia.'}
              </p>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const initials =
                student.fullName
                  .split(' ')
                  .filter(Boolean)
                  .pop()?.[0]
                  ?.toUpperCase() || 'H'

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  {/* Left: Avatar + Name */}
                  <div className="flex items-center gap-3">
                    {student.avatarUrl ? (
                      <img
                        src={student.avatarUrl}
                        alt={student.fullName}
                        className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-sky-50 text-indigo-700 text-xs font-bold border border-indigo-200/60 shadow-sm">
                        {initials}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-900 transition-colors">
                      {student.fullName}
                    </span>
                  </div>

                  {/* Right: Status Indicator Dot */}
                  <div className="flex items-center gap-2 pr-2">
                    {student.isOnline ? (
                      <span
                        className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 animate-pulse"
                        title="Đang hoạt động (Online)"
                      />
                    ) : (
                      <span
                        className="h-3 w-3 rounded-full bg-slate-300"
                        title="Ngoại tuyến (Offline)"
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
