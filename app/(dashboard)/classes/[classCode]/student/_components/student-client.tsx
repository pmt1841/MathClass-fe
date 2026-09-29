'use client'

import React, { use, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  FileText,
  MessageSquare,
  BookOpen,
  AlertCircle,
  Calendar,
  Users,
  Bell,
  Pin,
  ChevronRight,
  TrendingUp,
  Award,
  ChevronDown,
  Megaphone
} from 'lucide-react'
import { classroomService } from '@/services/classroomService'
import { assignmentService } from '@/services/assignmentService'
import { formatDateTime, parseDateSafe } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/services/chatService'
import { ClassroomStudentsPopover } from './ClassroomStudentsPopover'
import { ClassroomStudentChatWidget } from '@/components/chat/ClassroomStudentChatWidget'
import { ChatDockProvider, useChatDock } from '@/components/chat/ChatDockContext'
import { FloatingChatDock } from '@/components/chat/FloatingChatDock'
import { useClassroomChatUnread } from '@/hooks/useClassroomChatUnread'
import { useI18n } from '@/lib/i18n/i18n-context'

interface PageProps {
  params: Promise<{ classCode: string }>
}

// ─── Constants ─────────────────────────────────────────────────────────────
export interface TaskItem {
  id?: number;
  title?: string;
  submissionScore?: number;
  submissionStatus?: string;
  submissionUpdatedAt?: string;
  submissionCreatedAt?: string;
  [key: string]: any;
}

export interface StudentTask {
  id: number;
  title: string;
  description?: string;
  isSheet?: boolean;
  status?: string;
  submissionStatus?: string;
  deadline?: string;
  submissionScore?: number;
  createdAt?: string;
  items?: TaskItem[];
  [key: string]: any;
}

export interface Announcement {
  id: number;
  author: string;
  initials: string;
  time: string;
  pinned: boolean;
  type: string;
  content: string;
  comments: number;
  createdAt?: string;
}

export interface ClassroomData {
  id?: number;
  className?: string;
  teacherName?: string;
  teacherEmail?: string;
  teacherPhone?: string;
  teacherAvatarUrl?: string;
  teacherAvatar?: string;
  teacherId?: number;
  studentCount?: number;
  maxStudents?: number;
  students?: Array<{ id: number; fullName: string; email?: string; avatarUrl?: string }>;
  [key: string]: any;
}

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    author: 'Hệ thống',
    initials: 'HT',
    time: 'Vừa xong',
    pinned: true,
    content: 'Chào mừng bạn đến với lớp học. Hãy thường xuyên kiểm tra bài tập nhé!',
    comments: 0,
    type: 'system'
  }
]

export function StudentClassDetailPageClient({ params }: PageProps) {
  const { classCode } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()

  const [classroom, setClassroom] = useState<ClassroomData | null>(null)
  const [assignedTasks, setAssignedTasks] = useState<StudentTask[]>([])
  const [completedTasks, setCompletedTasks] = useState<StudentTask[]>([])
  const [overdueTasks, setOverdueTasks] = useState<StudentTask[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ completionRate: '0/0', avgScore: '0.0' })
  const [announcements, setAnnouncements] = useState<Announcement[]>(DEFAULT_ANNOUNCEMENTS)

  const [assignedLimit, setAssignedLimit] = useState(5)
  const [overdueLimit, setOverdueLimit] = useState(5)
  const [completedLimit, setCompletedLimit] = useState(5)

  const [loadingMoreAssigned, setLoadingMoreAssigned] = useState(false)
  const [loadingMoreOverdue, setLoadingMoreOverdue] = useState(false)
  const [loadingMoreCompleted, setLoadingMoreCompleted] = useState(false)

  const loadingAssignedTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const loadingOverdueTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const loadingCompletedTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleScrollAssigned = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      if (assignedLimit < assignedTasks.length && !loadingMoreAssigned) {
        setLoadingMoreAssigned(true)
        if (loadingAssignedTimeoutRef.current) clearTimeout(loadingAssignedTimeoutRef.current)
        loadingAssignedTimeoutRef.current = setTimeout(() => {
          setAssignedLimit(prev => Math.min(prev + 5, assignedTasks.length))
          setLoadingMoreAssigned(false)
        }, 500)
      }
    }
  }

  const handleScrollOverdue = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      if (overdueLimit < overdueTasks.length && !loadingMoreOverdue) {
        setLoadingMoreOverdue(true)
        if (loadingOverdueTimeoutRef.current) clearTimeout(loadingOverdueTimeoutRef.current)
        loadingOverdueTimeoutRef.current = setTimeout(() => {
          setOverdueLimit(prev => Math.min(prev + 5, overdueTasks.length))
          setLoadingMoreOverdue(false)
        }, 500)
      }
    }
  }

  const handleScrollCompleted = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      if (completedLimit < completedTasks.length && !loadingMoreCompleted) {
        setLoadingMoreCompleted(true)
        if (loadingCompletedTimeoutRef.current) clearTimeout(loadingCompletedTimeoutRef.current)
        loadingCompletedTimeoutRef.current = setTimeout(() => {
          setCompletedLimit(prev => Math.min(prev + 5, completedTasks.length))
          setLoadingMoreCompleted(false)
        }, 500)
      }
    }
  }

  const { user } = useAuth()

  useEffect(() => {
    if (user?.role === 'TEACHER' || user?.userRole === 'TEACHER') {
      router.replace(`/classes/${classCode}`)
    }
  }, [user, classCode, router])

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true)
        const [classData, assignData, sheetsData] = await Promise.all([
          classroomService.getClassroomDetail(classCode),
          classroomService.getClassroomAssignments(classCode, { size: 100, page: 0 }),
          assignmentService.getAssignmentSheets({ classCode, status: 'PUBLISHED' })
        ])
        setClassroom(classData)
        const allAssignments = (assignData?.content || assignData || []).map((a: StudentTask) => ({
          ...a,
          isSheet: false,
          status: 'PUBLISHED'
        }))
        const publishedAssignments = allAssignments.filter((a: StudentTask) => a.status === 'PUBLISHED')
        const sheets = (sheetsData?.content || []).map((s: StudentTask) => ({ ...s, isSheet: true, status: 'PUBLISHED' }))

        const allTasks: StudentTask[] = [...publishedAssignments, ...sheets]

        const now = new Date()
        const assigned: StudentTask[] = []
        const completed: StudentTask[] = []
        const overdue: StudentTask[] = []

        allTasks.forEach(task => {
          const subStatus = task.submissionStatus
          const isDone = subStatus === 'SUBMITTED' || subStatus === 'GRADED' || subStatus === 'LATE'
          const isPastDeadline = task.deadline ? (parseDateSafe(task.deadline)?.getTime() ?? Infinity) < now.getTime() : false

          if (isDone) {
            completed.push(task)
          } else if (isPastDeadline) {
            overdue.push(task)
          } else {
            assigned.push(task)
          }
        })

        // Sắp xếp Bài tập cần làm: Bài còn ít thời gian nhất (gần hạn nộp nhất) lên đầu
        assigned.sort((a: StudentTask, b: StudentTask) => {
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1 // Bài không có hạn nộp xếp xuống dưới
          if (!b.deadline) return -1
          const da = parseDateSafe(a.deadline)
          const db = parseDateSafe(b.deadline)
          if (!da || !db) return 0
          return da.getTime() - db.getTime()
        })

        // Tính toán thống kê
        const totalPublished = allTasks.length
        const totalCompleted = completed.length

        let totalScore = 0
        let gradedCount = 0
        completed.forEach(task => {
          if (task.submissionStatus === 'GRADED') {
            if (task.isSheet) {
              const sheetScore = task.items?.reduce((sum: number, item: TaskItem) => sum + (item.submissionScore || 0), 0) || 0
              totalScore += sheetScore
              gradedCount++
            } else if (task.submissionScore !== undefined && task.submissionScore !== null) {
              totalScore += task.submissionScore
              gradedCount++
            }
          }
        })
        const avgScore = gradedCount > 0 ? (totalScore / gradedCount).toFixed(1) : t('Chưa có điểm')

        setStats({
          completionRate: `${totalCompleted}/${totalPublished}`,
          avgScore: avgScore
        })

        // Tạo thông báo thật dựa trên bài tập được đăng
        const generatedAnnouncements = allTasks
          .map((task: StudentTask) => ({
            id: task.id + (task.isSheet ? 2000 : 1000),
            author: classData?.teacherName || t('Giáo viên'),
            initials: (classData?.teacherName || 'GV').split(' ').pop()?.[0]?.toUpperCase() || 'GV',
            time: formatDateTime(task.createdAt),
            pinned: false,
            type: 'assignment',
            content: task.isSheet 
              ? t('đã giao một phiếu bài tập mới: {title}', { title: task.title })
              : t('đã giao một bài tập mới: {title}', { title: task.title }),
            comments: 0,
            createdAt: task.createdAt
          }))
          .sort((a: Announcement, b: Announcement) => (parseDateSafe(b.createdAt)?.getTime() ?? 0) - (parseDateSafe(a.createdAt)?.getTime() ?? 0));

        if (generatedAnnouncements.length > 0) {
          generatedAnnouncements[0].pinned = true; // Pin the latest announcement
          setAnnouncements(generatedAnnouncements);
        }

        setAssignedTasks(assigned);
        setCompletedTasks(completed);
        setOverdueTasks(overdue);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu lớp học', error)
      } finally {
        setLoading(false)
      }
    }
    fetchClassData()
  }, [classCode])

  const teacherName = classroom?.teacherName || 'Đang cập nhật...'
  const teacherInitials = teacherName.split(' ').pop()?.[0]?.toUpperCase() || 'GV'
  const teacherEmail = classroom?.teacherEmail || 'Chưa cập nhật email'
  const teacherPhone = classroom?.teacherPhone || 'Chưa cập nhật SĐT'

  const latestAnnouncement = announcements[0] || DEFAULT_ANNOUNCEMENTS[0]
  const oldAnnouncements = announcements.slice(1, 4) // Max 3 old announcements

  return (
    <ChatDockProvider
      classId={classroom?.id || 0}
      classCode={classCode}
      currentUserId={user?.id || 0}
    >
      <StudentClassDetailPageContent
        classCode={classCode}
        classroom={classroom}
        assignedTasks={assignedTasks}
        completedTasks={completedTasks}
        overdueTasks={overdueTasks}
        loading={loading}
        stats={stats}
        assignedLimit={assignedLimit}
        overdueLimit={overdueLimit}
        completedLimit={completedLimit}
        loadingMoreAssigned={loadingMoreAssigned}
        loadingMoreOverdue={loadingMoreOverdue}
        loadingMoreCompleted={loadingMoreCompleted}
        handleScrollAssigned={handleScrollAssigned}
        handleScrollOverdue={handleScrollOverdue}
        handleScrollCompleted={handleScrollCompleted}
        teacherName={teacherName}
        teacherInitials={teacherInitials}
        teacherEmail={teacherEmail}
        teacherPhone={teacherPhone}
        latestAnnouncement={latestAnnouncement}
        oldAnnouncements={oldAnnouncements}
        router={router}
        searchParams={searchParams}
      />
    </ChatDockProvider>
  )
}

interface StudentClassDetailPageContentProps {
  classCode: string
  classroom: ClassroomData | null
  assignedTasks: StudentTask[]
  completedTasks: StudentTask[]
  overdueTasks: StudentTask[]
  loading: boolean
  stats: { completionRate: string; avgScore: string }
  assignedLimit: number
  overdueLimit: number
  completedLimit: number
  loadingMoreAssigned: boolean
  loadingMoreOverdue: boolean
  loadingMoreCompleted: boolean
  handleScrollAssigned: (e: React.UIEvent<HTMLDivElement>) => void
  handleScrollOverdue: (e: React.UIEvent<HTMLDivElement>) => void
  handleScrollCompleted: (e: React.UIEvent<HTMLDivElement>) => void
  teacherName: string
  teacherInitials: string
  teacherEmail?: string
  teacherPhone?: string
  latestAnnouncement?: Announcement
  oldAnnouncements: Announcement[]
  router: any
  searchParams: any
}

interface AutoOpenTeacherChatProps {
  teacherName: string
  teacherAvatar?: string
  teacherId?: number
}

function StudentClassDetailPageContent({
  classCode,
  classroom,
  assignedTasks,
  completedTasks,
  overdueTasks,
  loading,
  stats,
  assignedLimit,
  overdueLimit,
  completedLimit,
  loadingMoreAssigned,
  loadingMoreOverdue,
  loadingMoreCompleted,
  handleScrollAssigned,
  handleScrollOverdue,
  handleScrollCompleted,
  teacherName,
  teacherInitials,
  teacherEmail,
  teacherPhone,
  latestAnnouncement,
  oldAnnouncements,
  router,
  searchParams,
}: StudentClassDetailPageContentProps) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const { openChat } = useChatDock()
  const { hasGroupUnread, groupUnreadCount, hasAnyStudentUnread, unreadStudentIds, studentUnreadCounts } = useClassroomChatUnread(classCode)
  const teacherId = classroom?.teacherId
  const hasTeacherUnread = teacherId ? unreadStudentIds.includes(teacherId) : false
  const teacherUnreadCount = teacherId ? (studentUnreadCounts[teacherId] || 0) : 0
  const hasOtherStudentUnread = teacherId
    ? unreadStudentIds.some((id: number) => id !== teacherId)
    : hasAnyStudentUnread

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

      <div className="relative bg-white border-b border-border shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 opacity-70" />

        <div className="relative z-10 mx-auto max-w-[1600px] px-6 pt-6 pb-8">
          <button
            onClick={() => router.push('/classes')}
            className="mb-4 flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Quay lại danh sách lớp')}
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 backdrop-blur-sm border border-slate-200/60 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                  <BookOpen className="h-3 w-3" />
                  {t('Mã lớp')}: {classCode}
                </span>
                <ClassroomStudentsPopover
                  classCode={classCode}
                  studentCount={classroom?.studentCount || 0}
                  maxStudents={classroom?.maxStudents || 0}
                  hasUnread={hasOtherStudentUnread}
                />
                <button
                  type="button"
                  onClick={async () => {
                    openChat({ id: 'group', type: 'CLASS_GROUP', title: t('Chat Lớp') })
                    try {
                      await chatService.markGroupAsRead(classCode)
                      queryClient.invalidateQueries({ queryKey: ['classroom-chat-unread', classCode] })
                      queryClient.invalidateQueries({ queryKey: ['unread-chat-classes'] })
                    } catch (e) {
                    }
                  }}
                  className="relative inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-100 hover:text-indigo-800 transition-all cursor-pointer active:scale-95"
                  title={t('Mở kênh Chat nhóm Lớp học')}
                >
                  <div className="relative flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-indigo-600" />
                    {hasGroupUnread && (
                      <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  <span>{t('Chat Lớp')}</span>
                  {hasGroupUnread && (
                    <span className="flex-shrink-0 text-[10px] font-extrabold text-white bg-rose-500 px-1.5 py-0.5 rounded-full animate-pulse shadow-xs">
                      {groupUnreadCount > 0 ? t('{groupUnreadCount} mới', { groupUnreadCount }) : t('Mới')}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    openChat({
                      id: 'teacher',
                      type: 'DIRECT_TEACHER',
                      title: teacherName,
                      avatar: classroom?.teacherAvatarUrl || classroom?.teacherAvatar,
                      targetUserId: classroom?.teacherId,
                    })
                    try {
                      await chatService.markAsRead(classCode)
                      queryClient.invalidateQueries({ queryKey: ['classroom-chat-unread', classCode] })
                      queryClient.invalidateQueries({ queryKey: ['unread-chat-classes'] })
                    } catch (e) {
                    }
                  }}
                  className="relative inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3.5 py-1 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-100 hover:text-blue-800 transition-all cursor-pointer active:scale-95"
                  title={t('Mở khung Chat riêng với Giảng viên')}
                >
                  <div className="relative flex items-center justify-center">
                    <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                    {hasTeacherUnread && (
                      <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  <span>{t('Hỏi Giảng viên')}</span>
                  {hasTeacherUnread && (
                    <span className="flex-shrink-0 text-[10px] font-extrabold text-white bg-rose-500 px-1.5 py-0.5 rounded-full animate-pulse shadow-xs">
                      {teacherUnreadCount > 0 ? t('{teacherUnreadCount} mới', { teacherUnreadCount }) : t('Mới')}
                    </span>
                  )}
                </button>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
                {classroom?.className || t('Đang tải...')}
              </h1>
            </div>

            <div className="lg:w-[500px] xl:w-[600px] flex-shrink-0">
              <div className="bg-amber-50/80 backdrop-blur-md border border-amber-200/60 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2">
                  <Megaphone className="h-20 w-20 text-amber-500" />
                </div>
                <div className="relative z-10 flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Pin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-amber-800 bg-amber-200/50 px-2 py-0.5 rounded-full">{t('Tin mới nhất')}</span>
                      <span className="text-[11px] text-amber-600/80">{latestAnnouncement?.time ? t(latestAnnouncement.time) : ''}</span>
                    </div>
                    <p className="text-sm text-amber-950 font-medium leading-snug line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                      {latestAnnouncement?.content}
                    </p>
                    <p className="text-[11px] font-semibold text-amber-700 mt-2">— {latestAnnouncement?.author ? t(latestAnnouncement.author) : ''}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 xl:gap-8">

            <div className="space-y-6 lg:col-span-1 hidden lg:block">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-all duration-200">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t('Giáo viên phụ trách')}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-700 text-base font-extrabold border border-indigo-200/50 shadow-sm">
                    {teacherInitials}
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-800">{teacherName}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{teacherPhone}</p>
                    <p className="text-[11px] text-muted-foreground">{teacherEmail}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">{t('Kết quả của bạn')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">{t('Hoàn thành')}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{stats.completionRate}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">{t('Điểm trung bình')}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{stats.avgScore}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-2">

              <details open className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer bg-blue-50/30 hover:bg-blue-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {t('Bài tập cần làm')}
                      <span className="ml-2 rounded-full bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5">
                        {assignedTasks.length}
                      </span>
                    </h3>
                  </div>
                  <ChevronDown className="h-5 w-5 text-slate-400 details-chevron transition-transform duration-300" />
                </summary>

                <div
                  onScroll={handleScrollAssigned}
                  className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-3 max-h-[400px] overflow-y-auto pr-1"
                >
                  {loading ? (
                    <div className="text-sm text-muted-foreground text-center py-8">{t('Đang tải danh sách bài tập...')}</div>
                  ) : assignedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                      <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
                      <p className="text-sm font-bold text-slate-700">{t('Thật tuyệt vời!')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('Bạn đã hoàn thành tất cả bài tập hiện tại.')}</p>
                    </div>
                  ) : (
                    <>
                      {assignedTasks.slice(0, assignedLimit).map((task: StudentTask) => {
                        if (task.isSheet) {
                          return (
                            <details
                              key={task.isSheet ? `sheet-${task.id}` : `task-${task.id}`}
                              className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden"
                            >
                              <summary className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer">
                                <div className="flex items-start gap-4">
                                  <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                    <BookOpen className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-base text-slate-900 group-hover:text-indigo-700 transition-colors">{task.title} ({t('Phiếu bài tập')})</h4>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{task.description || t('Không có mô tả chi tiết')}</p>
                                    <div className="flex items-center gap-3 mt-3">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 bg-red-50 text-red-600 border border-red-100">
                                        <Clock className="h-3 w-3" />
                                        {t('Hạn nộp')}: {task.deadline ? formatDateTime(task.deadline) : t('Không có thời hạn')}
                                      </span>
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100">
                                        {t('{count} bài tập', { count: task.items?.length || 0 })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 self-start sm:self-center flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-all">
                                  {t('Mở phiếu')}
                                  <ChevronDown className="h-4 w-4 details-chevron transition-transform duration-300" />
                                </div>
                              </summary>
                              <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
                                {task.items?.map((item: TaskItem, i: number) => (
                                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{i + 1}. {item.title}</h4>
                                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
                                        {item.maxScore ?? 10} {t('đ')}
                                      </span>
                                    </div>
                                    <Link
                                      href={`/assignments/${item.id}?classCode=${classCode}&from=class`}
                                      className="flex-shrink-0 self-start sm:self-center text-xs font-bold text-white bg-slate-900 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors"
                                    >
                                      {(() => {
                                        const isItemOverdue = task.deadline && (parseDateSafe(task.deadline)?.getTime() ?? 0) < Date.now();
                                        if (item.submissionStatus === 'GRADED') return t('Xem điểm');
                                        if (item.submissionStatus === 'SUBMITTED' || item.submissionStatus === 'LATE') return isItemOverdue ? t('Xem bài nộp') : t('Sửa bài nộp');
                                        return isItemOverdue ? t('Xem đề bài') : t('Làm bài');
                                      })()}
                                    </Link>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )
                        }

                        return (
                          <div
                            key={task.isSheet ? `sheet-${task.id}` : `task-${task.id}`}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-base text-slate-900 group-hover:text-blue-700 transition-colors">{task.title}</h4>
                                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{task.description || t('Không có mô tả chi tiết')}</p>
                                <div className="flex items-center gap-3 mt-3">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 bg-red-50 text-red-600 border border-red-100">
                                    <Clock className="h-3 w-3" />
                                    {t('Hạn nộp')}: {task.deadline ? formatDateTime(task.deadline) : t('Không có thời hạn')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Link
                              href={`/assignments/${task.id}?classCode=${classCode}&from=class`}
                              className="flex-shrink-0 self-start sm:self-center flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 hover:shadow-md hover:shadow-blue-200 transition-all active:scale-[.98]"
                            >
                              {t('Làm bài')}
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        )
                      })}

                      {assignedTasks.length > 0 && (
                        <div className="pt-2 text-center">
                          {loadingMoreAssigned ? (
                            <p className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 py-2 border-t border-dashed border-blue-200">
                              <span className="h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                              {t('Đang tải 5 bài tiếp theo...')}
                            </p>
                          ) : assignedLimit < assignedTasks.length ? (
                            <p className="text-xs font-medium text-slate-400 py-2 border-t border-dashed border-slate-200">
                              {t('Cuộn xuống để tải thêm bài tập...')} ({assignedLimit}/{assignedTasks.length} {t('bài')})
                            </p>
                          ) : (
                            <p className="text-xs font-semibold text-slate-400 py-2 border-t border-slate-200/60 bg-slate-100/50 rounded-xl">
                              ✓ {t('Đã hiển thị tất cả {count} bài tập', { count: assignedTasks.length })}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </details>

              <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer bg-red-50/30 hover:bg-red-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {t('Bài tập quá hạn')}
                      <span className="ml-2 rounded-full bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5">
                        {overdueTasks.length}
                      </span>
                    </h3>
                  </div>
                  <ChevronDown className="h-5 w-5 text-slate-400 details-chevron transition-transform duration-300" />
                </summary>
                <div
                  onScroll={handleScrollOverdue}
                  className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-3 max-h-[400px] overflow-y-auto pr-1"
                >
                  {overdueTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">{t('Bạn không có bài tập nào quá hạn.')}</p>
                  ) : (
                    <>
                      {overdueTasks.slice(0, overdueLimit).map((task: StudentTask) => {
                        if (task.isSheet) {
                          return (
                            <details
                              key={task.isSheet ? `sheet-${task.id}` : `task-${task.id}`}
                              className="group flex flex-col rounded-2xl border border-red-200 bg-white shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden"
                            >
                              <summary className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer">
                                <div className="flex items-start gap-4">
                                  <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                                    <BookOpen className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-base text-slate-900 group-hover:text-red-700 transition-colors">{task.title} ({t('Phiếu quá hạn')})</h4>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{task.description || t('Không có mô tả chi tiết')}</p>
                                    <div className="flex items-center gap-3 mt-3">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 bg-red-100 text-red-700 border border-red-200">
                                        <Clock className="h-3 w-3" />
                                        {t('Đã quá hạn')}: {task.deadline ? formatDateTime(task.deadline) : ''}
                                      </span>
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 bg-slate-100 text-slate-600">
                                        {t('{count} bài tập', { count: task.items?.length || 0 })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 self-start sm:self-center flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 transition-all">
                                  {t('Xem chi tiết')}
                                  <ChevronDown className="h-4 w-4 details-chevron transition-transform duration-300" />
                                </div>
                              </summary>
                              <div className="p-5 border-t border-red-100 bg-red-50/30 space-y-3">
                                {task.items?.map((item: TaskItem, i: number) => (
                                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-100 bg-white p-3 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{i + 1}. {item.title}</h4>
                                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
                                        {item.maxScore ?? 10} {t('đ')}
                                      </span>
                                    </div>
                                    <Link
                                      href={`/assignments/${item.id}?classCode=${classCode}&from=class`}
                                      className="flex-shrink-0 self-start sm:self-center text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                                    >
                                      {(() => {
                                        if (item.submissionStatus === 'GRADED') return t('Xem điểm');
                                        if (item.submissionStatus === 'SUBMITTED' || item.submissionStatus === 'LATE') return t('Xem bài nộp');
                                        return t('Vẫn nộp bài');
                                      })()}
                                    </Link>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )
                        }

                        return (
                          <div key={task.isSheet ? `sheet-${task.id}` : `task-${task.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-100 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col">
                              <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{task.title}</h4>
                              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                <AlertCircle className="h-3 w-3" />
                                {t('Hết hạn')}: {task.deadline ? formatDateTime(task.deadline) : t('Không có thời hạn')}
                              </span>
                            </div>
                            <Link
                              href={`/assignments/${task.id}?classCode=${classCode}&from=class`}
                              className="flex-shrink-0 self-start sm:self-center text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                            >
                              {t('Vẫn nộp bài')}
                            </Link>
                          </div>
                        )
                      })}

                      {overdueTasks.length > 0 && (
                        <div className="pt-2 text-center">
                          {loadingMoreOverdue ? (
                            <p className="flex items-center justify-center gap-2 text-xs font-semibold text-red-600 py-2 border-t border-dashed border-red-200">
                              <span className="h-3.5 w-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                              {t('Đang tải 5 bài tiếp theo...')}
                            </p>
                          ) : overdueLimit < overdueTasks.length ? (
                            <p className="text-xs font-medium text-red-400 py-2 border-t border-dashed border-red-200">
                              {t('Cuộn xuống để tải thêm bài tập...')} ({overdueLimit}/{overdueTasks.length} {t('bài')})
                            </p>
                          ) : (
                            <p className="text-xs font-semibold text-red-400 py-2 border-t border-red-200/60 bg-red-50/50 rounded-xl">
                              ✓ {t('Đã hiển thị tất cả {count} bài tập quá hạn', { count: overdueTasks.length })}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </details>

              <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {t('Đã hoàn thành')}
                      <span className="ml-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5">
                        {completedTasks.length}
                      </span>
                    </h3>
                  </div>
                  <ChevronDown className="h-5 w-5 text-slate-400 details-chevron transition-transform duration-300" />
                </summary>
                <div
                  onScroll={handleScrollCompleted}
                  className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-3 max-h-[400px] overflow-y-auto pr-1"
                >
                  {completedTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">{t('Bạn chưa hoàn thành bài tập nào.')}</p>
                  ) : (
                    <>
                      {completedTasks.slice(0, completedLimit).map((task: StudentTask) => {
                        if (task.isSheet) {
                          const isGraded = task.submissionStatus === 'GRADED';
                          const submittedAt = t('Đã hoàn thành');

                          const totalSheetScore = task.items?.reduce((sum: number, item: TaskItem) => sum + (item.submissionScore || 0), 0) || 0;
                          const allItemsGraded = (task.items?.length ?? 0) > 0 && task.items!.every((item: TaskItem) => item.submissionStatus === 'GRADED');

                          return (
                            <details
                              key={task.isSheet ? `sheet-${task.id}` : `task-${task.id}`}
                              className="group flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all [&_summary::-webkit-details-marker]:hidden"
                            >
                              <summary className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{task.title} ({t('Phiếu bài tập')})</h4>
                                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                                      {t('{count} bài tập', { count: task.items?.length || 0 })}
                                    </span>
                                    {allItemsGraded && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                                        {totalSheetScore}/10 {t('điểm')}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-[11px] text-slate-400">{t('Đã nộp')}: {submittedAt}</p>
                                </div>
                                <div className="flex-shrink-0 self-start sm:self-center flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200">
                                  {t('Xem chi tiết')}
                                  <ChevronDown className="h-4 w-4 details-chevron transition-transform duration-300" />
                                </div>
                              </summary>
                              <div className="p-4 border-t border-slate-100 bg-slate-50/30 space-y-3">
                                {task.items?.map((item: TaskItem, i: number) => {
                                  const itemGraded = item.submissionStatus === 'GRADED';
                                  const itemSubmittedAt = item.submissionUpdatedAt || item.submissionCreatedAt ? formatDateTime(item.submissionUpdatedAt || item.submissionCreatedAt) : t('Chưa có thông tin');
                                  return (
                                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-all">
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{i + 1}. {item.title}</h4>
                                          {itemGraded ? (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                                              {item.submissionScore ?? 0}/{item.maxScore ?? 10} {t('điểm')}
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                                              {t('Chờ chấm')}
                                            </span>
                                          )}
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-400">{t('Đã nộp')}: {itemSubmittedAt}</p>
                                      </div>
                                      <Link
                                        href={`/assignments/${item.id}?classCode=${classCode}&from=class`}
                                        className="flex-shrink-0 self-start sm:self-center text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                                      >
                                        {t('Xem lại bài')}
                                      </Link>
                                    </div>
                                  )
                                })}
                              </div>
                            </details>
                          )
                        }

                        const isGraded = task.submissionStatus === 'GRADED';
                        const submittedAt = task.submissionUpdatedAt || task.submissionCreatedAt ? formatDateTime(task.submissionUpdatedAt || task.submissionCreatedAt) : t('Chưa có thông tin');

                        return (
                          <div key={task.isSheet ? `sheet-${task.id}` : `task-${task.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{task.title}</h4>
                                {isGraded ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                                    {task.submissionScore ?? 0}/{task.maxScore ?? 10} {t('điểm')}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                                    {t('Chờ chấm')}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[11px] text-slate-400">{t('Đã nộp')}: {submittedAt}</p>
                            </div>
                            <Link
                              href={`/assignments/${task.id}?classCode=${classCode}&from=class`}
                              className="flex-shrink-0 self-start sm:self-center text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                            >
                              {t('Xem lại bài')}
                            </Link>
                          </div>
                        )
                      })}

                      {completedTasks.length > 0 && (
                        <div className="pt-2 text-center">
                          {loadingMoreCompleted ? (
                            <p className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 py-2 border-t border-dashed border-emerald-200">
                              <span className="h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                              {t('Đang tải 5 bài tiếp theo...')}
                            </p>
                          ) : completedLimit < completedTasks.length ? (
                            <p className="text-xs font-medium text-emerald-500 py-2 border-t border-dashed border-emerald-200">
                              {t('Cuộn xuống để tải thêm bài tập...')} ({completedLimit}/{completedTasks.length} {t('bài')})
                            </p>
                          ) : (
                            <p className="text-xs font-semibold text-emerald-600 py-2 border-t border-emerald-200/60 bg-emerald-50/50 rounded-xl">
                              ✓ {t('Đã hiển thị tất cả {count} bài tập đã hoàn thành', { count: completedTasks.length })}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </details>

            </div>

            <div className="space-y-6 lg:col-span-1">

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100">
                      <Bell className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-800">{t('Thông báo khác')}</h2>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {oldAnnouncements.map((ann: Announcement) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors flex items-start gap-3 shadow-2xs"
                    >
                      <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">
                        {ann.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-slate-800">{ann.author ? t(ann.author) : ''}</span>
                          <span className="text-[10px] text-slate-400">{ann.time ? t(ann.time) : ''}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ann.content ? t(ann.content) : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                  <button className="w-full text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors py-1.5">
                    {t('Xem tất cả thông báo')}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Auto open teacher chat if chat=open in URL */}
      {searchParams.get('chat') === 'open' && (
        <AutoOpenTeacherChat
          teacherName={teacherName}
          teacherAvatar={classroom?.teacherAvatarUrl || classroom?.teacherAvatar}
          teacherId={classroom?.teacherId}
        />
      )}

      {/* Floating Chat Dock thống nhất duy nhất cho tất cả loại chat */}
      <FloatingChatDock />
    </div>
  )
}

function AutoOpenTeacherChat({ teacherName, teacherAvatar, teacherId }: any) {
  const { openChat } = useChatDock()
  useEffect(() => {
    openChat({
      id: 'teacher',
      type: 'DIRECT_TEACHER',
      title: teacherName,
      avatar: teacherAvatar,
      targetUserId: teacherId,
    })
  }, [openChat, teacherName, teacherAvatar, teacherId])
  return null
}
