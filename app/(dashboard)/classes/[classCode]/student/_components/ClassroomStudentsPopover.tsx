'use client'

import React, { useState, useEffect } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Users, Search, Loader2, ChevronDown, MessageSquare } from 'lucide-react'
import { classroomService } from '@/services/classroomService'
import { Student } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useChatDock } from '@/components/chat/ChatDockContext'

interface ClassroomStudentsPopoverProps {
  classCode: string
  studentCount?: number
  maxStudents?: number
}

export function ClassroomStudentsPopover({
  classCode,
  studentCount = 0,
  maxStudents = 0,
}: ClassroomStudentsPopoverProps) {
  const { user: currentUser } = useAuth()
  const { openChat } = useChatDock()
  const [isOpen, setIsOpen] = useState(false)
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
        // Order by s.lastActiveAt,desc
        const res = await classroomService.getClassroomStudents(classCode, {
          page: 0,
          size: 100,
          sort: 's.lastActiveAt,desc',
        })
        const studentList: Student[] = res?.content || res || []

        // Format and mark self user as online
        const processedList = studentList.map((s) => {
          const isSelf = Boolean(
            (currentUser?.id && s.id === currentUser.id) ||
            (currentUser?.email && s.email?.toLowerCase() === currentUser.email?.toLowerCase())
          )
          const rawOnline = s.isOnline ?? (s as any).online
          return {
            ...s,
            isOnline: isSelf ? true : Boolean(rawOnline),
          }
        })

        // Fallback sorting: Ensure Online users are always prioritized at the top
        const sortedList = [...processedList].sort((a, b) => {
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 backdrop-blur-sm border border-slate-200/60 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all cursor-pointer group active:scale-[0.98]"
          title="Click để xem danh sách học sinh"
        >
          <Users className="h-3.5 w-3.5 group-hover:text-indigo-600 transition-colors" />
          <span>
            {studentCount}/{maxStudents} học sinh
          </span>
          <ChevronDown
            className={`h-3 w-3 text-slate-400 group-hover:text-indigo-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[360px] sm:w-[400px] p-0 shadow-2xl rounded-2xl border border-slate-200/80 bg-white z-[50] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 bg-slate-50/90 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-600 shadow-sm">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Danh sách học sinh
                </h4>
                <p className="text-[11px] text-slate-500">
                  {studentCount || students.length} thành viên trong lớp
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {onlineCount} Online
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 mt-3">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
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
              className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                activeTab === 'online'
                  ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Chỉ Online ({onlineCount})
            </button>
          </div>
        </div>

        {/* Search Input (If list > 5 items) */}
        {students.length > 5 && (
          <div className="px-3 pt-2.5 pb-1 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm học sinh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>
        )}

        {/* Student List */}
        <div className="p-2 max-h-[320px] overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs font-medium">Đang tải danh sách học sinh...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 px-4">
              <p className="text-xs text-red-500 font-semibold">{error}</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Users className="h-8 w-8 text-slate-300 mb-1.5" />
              <p className="text-xs font-bold text-slate-700">
                {activeTab === 'online'
                  ? 'Không có học sinh nào đang trực tuyến'
                  : searchQuery
                  ? 'Không tìm thấy học sinh'
                  : 'Chưa có học sinh trong lớp'}
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

              const isSelf = Boolean(
                (currentUser?.id && student.id === currentUser.id) ||
                (currentUser?.email && student.email?.toLowerCase() === currentUser.email?.toLowerCase())
              )
              return (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-2 rounded-xl transition-colors group ${
                    isSelf ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-50 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isSelf) {
                      openChat({
                        id: `student-${student.id}`,
                        type: 'DIRECT_STUDENT',
                        title: student.fullName,
                        avatar: student.avatarUrl,
                        targetUserId: student.id,
                      })
                      setIsOpen(false)
                    }
                  }}
                >
                  {/* Left: Avatar + Full Name */}
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
                      {student.avatarUrl && (
                        <AvatarImage src={student.avatarUrl} alt={student.fullName} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-sky-50 text-indigo-700 text-xs font-bold border border-indigo-200/60">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-900 transition-colors">
                        {student.fullName}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/70 border border-indigo-200/60 rounded-md px-1.5 py-0.2">
                          Tôi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Status Indicator Dot & Chat Action */}
                  <div className="flex items-center gap-2 pr-1">
                    {!isSelf && (
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 p-1 text-indigo-600 hover:bg-indigo-100/60 rounded-lg transition-all"
                        title={`Nhắn tin riêng với ${student.fullName}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          openChat({
                            id: `student-${student.id}`,
                            type: 'DIRECT_STUDENT',
                            title: student.fullName,
                            avatar: student.avatarUrl,
                            targetUserId: student.id,
                          })
                          setIsOpen(false)
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {student.isOnline ? (
                      <span
                        className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 animate-pulse"
                        title="Đang hoạt động (Online)"
                      />
                    ) : (
                      <span
                        className="h-2.5 w-2.5 rounded-full bg-slate-300"
                        title="Ngoại tuyến (Offline)"
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
