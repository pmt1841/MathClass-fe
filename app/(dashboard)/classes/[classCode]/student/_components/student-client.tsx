'use client'

import React, { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { submissionService } from '@/services/submissionService'
import { assignmentService } from '@/services/assignmentService'
import { formatDateTime, parseDateSafe } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface PageProps {
  params: Promise<{ classCode: string }>
}

// ─── Constants ─────────────────────────────────────────────────────────────
const DEFAULT_ANNOUNCEMENTS = [
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

  const [classroom, setClassroom] = useState<any>(null)
  const [assignedTasks, setAssignedTasks] = useState<any[]>([])
  const [completedTasks, setCompletedTasks] = useState<any[]>([])
  const [overdueTasks, setOverdueTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ completionRate: '0/0', avgScore: '0.0' })
  const [announcements, setAnnouncements] = useState<any[]>(DEFAULT_ANNOUNCEMENTS)

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
        const allAssignments = assignData?.content || assignData || []
        const publishedAssignments = allAssignments.filter((a: any) => a.status === 'PUBLISHED')
        const sheets = (sheetsData?.content || []).map((s: any) => ({ ...s, isSheet: true, status: 'PUBLISHED' }))

        const tasksWithSubs = await Promise.all(
          publishedAssignments.map(async (task: any) => {
            try {
              const subData = await submissionService.getMySubmission(task.id);
              return { ...task, submission: subData || null };
            } catch (error) {
              return { ...task, submission: null };
            }
          })
        );

        // Add sheets with their submission status (already calculated from backend or frontend logic)
        const allTasks = [...tasksWithSubs, ...sheets];

        const now = new Date();
        const assigned: any[] = [];
        const completed: any[] = [];
        const overdue: any[] = [];

        allTasks.forEach(task => {
          const subStatus = task.isSheet ? task.submissionStatus : task.submission?.status;
          const isDone = subStatus === 'SUBMITTED' || subStatus === 'GRADED' || subStatus === 'LATE';
          const isPastDeadline = task.deadline ? (parseDateSafe(task.deadline)?.getTime() ?? Infinity) < now.getTime() : false;

          if (isDone) {
            completed.push(task);
          } else if (isPastDeadline) {
            overdue.push(task);
          } else {
            assigned.push(task);
          }
        });

        // Sắp xếp Bài tập cần làm: Bài còn ít thời gian nhất (gần hạn nộp nhất) lên đầu
        assigned.sort((a: any, b: any) => {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1; // Bài không có hạn nộp xếp xuống dưới
          if (!b.deadline) return -1;
          const da = parseDateSafe(a.deadline);
          const db = parseDateSafe(b.deadline);
          if (!da || !db) return 0;
          return da.getTime() - db.getTime();
        });

        // Tính toán thống kê
        const totalPublished = allTasks.length;
        const totalCompleted = completed.length;

        let totalScore = 0;
        let gradedCount = 0;
        completed.forEach(task => {
          const subStatus = task.isSheet ? task.submissionStatus : task.submission?.status;
          if (subStatus === 'GRADED') {
            if (task.isSheet) {
              const sheetScore = task.items?.reduce((sum: number, item: any) => sum + (item.submissionScore || 0), 0) || 0;
              totalScore += sheetScore;
              gradedCount++;
            } else if (task.submission?.score !== undefined) {
              totalScore += task.submission.score;
              gradedCount++;
            }
          }
        });
        const avgScore = gradedCount > 0 ? (totalScore / gradedCount).toFixed(1) : 'Chưa có điểm';

        setStats({
          completionRate: `${totalCompleted}/${totalPublished}`,
          avgScore: avgScore
        });

        // Tạo thông báo thật dựa trên bài tập được đăng
        const generatedAnnouncements = allTasks
          .map((task: any, index: number) => ({
            id: task.id + (task.isSheet ? 2000 : 1000),
            author: classData?.teacherName || 'Giáo viên',
            initials: (classData?.teacherName || 'GV').split(' ').pop()?.[0]?.toUpperCase() || 'GV',
            time: formatDateTime(task.createdAt),
            pinned: false,
            type: 'assignment',
            content: `đã giao một ${task.isSheet ? 'phiếu bài tập' : 'bài tập'} mới: ${task.title}`,
            comments: 0,
            createdAt: task.createdAt
          }))
          .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

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
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

      {/* ── Hero & Banner Section ── */}
      <div className="relative bg-white border-b border-border shadow-sm">
        {/* Background gradient/glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 opacity-70" />

        <div className="relative z-10 mx-auto max-w-[1600px] px-6 pt-6 pb-8">
          <button
            onClick={() => router.push('/classes')}
            className="mb-4 flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách lớp
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">

            {/* Title & Info */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 backdrop-blur-sm border border-slate-200/60 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                  <BookOpen className="h-3 w-3" />
                  Mã lớp: {classCode}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 backdrop-blur-sm border border-slate-200/60 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                  <Users className="h-3 w-3" />
                  {classroom?.studentCount || 0}/{classroom?.maxStudents || 0} học sinh
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
                {classroom?.className || 'Đang tải...'}
              </h1>
            </div>

            {/* Latest Announcement Banner */}
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
                      <span className="text-xs font-bold text-amber-800 bg-amber-200/50 px-2 py-0.5 rounded-full">Tin mới nhất</span>
                      <span className="text-[11px] text-amber-600/80">{latestAnnouncement.time}</span>
                    </div>
                    <p className="text-sm text-amber-950 font-medium leading-snug line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                      {latestAnnouncement.content}
                    </p>
                    <p className="text-[11px] font-semibold text-amber-700 mt-2">— {latestAnnouncement.author}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 xl:gap-8">

            {/* ── Column 1 (Left 25%): Quick Info & Calendar ── */}
            <div className="space-y-6 lg:col-span-1 hidden lg:block">
              {/* Teacher Info */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-all duration-200">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Giáo viên phụ trách</h3>
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
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">Kết quả của bạn</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">Hoàn thành</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{stats.completionRate}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">Điểm trung bình</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{stats.avgScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Column 2 (Middle 50%): Productivity Focus ── */}
            <div className="space-y-6 lg:col-span-2">

              {/* Assignments To Do */}
              <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                {/* Subtle background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-200">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Bài tập cần làm</h2>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">Bạn đang có {assignedTasks.length} nhiệm vụ</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div className="text-sm text-muted-foreground text-center py-8">Đang tải danh sách bài tập...</div>
                  ) : assignedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                      <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
                      <p className="text-sm font-bold text-slate-700">Thật tuyệt vời!</p>
                      <p className="text-xs text-muted-foreground mt-1">Bạn đã hoàn thành tất cả bài tập hiện tại.</p>
                    </div>
                  ) : assignedTasks.map((task) => {
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
                                <h4 className="font-bold text-base text-slate-900 group-hover:text-indigo-700 transition-colors">{task.title} (Phiếu bài tập)</h4>
                                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{task.description || 'Không có mô tả chi tiết'}</p>
                                <div className="flex items-center gap-3 mt-3">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 bg-red-50 text-red-600 border border-red-100">
                                    <Clock className="h-3 w-3" />
                                    Hạn nộp: {task.deadline ? formatDateTime(task.deadline) : 'Không có thời hạn'}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    {task.items?.length || 0} bài tập
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0 self-start sm:self-center flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-all">
                              Mở phiếu
                              <ChevronDown className="h-4 w-4 details-chevron transition-transform duration-300" />
                            </div>
                          </summary>
                          <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
                            {task.items?.map((item: any, i: number) => (
                              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{i + 1}. {item.title}</h4>
                                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
                                    {item.maxScore ?? 10} đ
                                  </span>
                                </div>
                                <Link
                                  href={`/assignments/${item.id}?classCode=${classCode}&from=class`}
                                  className="flex-shrink-0 self-start sm:self-center text-xs font-bold text-white bg-slate-900 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors"
                                >
                                  {(() => {
                                    const isItemOverdue = task.deadline && (parseDateSafe(task.deadline)?.getTime() ?? 0) < Date.now();
                                    if (item.submissionStatus === 'GRADED') return 'Xem điểm';
                                    if (item.submissionStatus === 'SUBMITTED' || item.submissionStatus === 'LATE') return isItemOverdue ? 'Xem bài nộp' : 'Sửa bài nộp';
                                    return isItemOverdue ? 'Xem đề bài' : 'Làm bài';
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
                            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{task.description || 'Không có mô tả chi tiết'}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 bg-red-50 text-red-600 border border-red-100">
                                <Clock className="h-3 w-3" />
                                Hạn nộp: {task.deadline ? formatDateTime(task.deadline) : 'Không có thời hạn'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/assignments/${task.id}?classCode=${classCode}&from=class`}
                          className="flex-shrink-0 self-start sm:self-center flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 hover:shadow-md hover:shadow-blue-200 transition-all active:scale-[.98]"
                        >
                          Làm bài
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Overdue Tasks (Accordion) */}
              {overdueTasks.length > 0 && (
                <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer bg-red-50/30 hover:bg-red-50/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Bài tập quá hạn
                        <span className="ml-2 rounded-full bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5">
                          {overdueTasks.length}
                        </span>
                      </h3>
                    </div>
                    <ChevronDown className="h-5 w-5 text-slate-400 details-chevron transition-transform duration-300" />
                  </summary>
                  <div className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-3">
                    {overdueTasks.map((task) => {
                      if (task.isSheet) {
                        return (
                          <details
                            key={task.isSheet ? `sheet-${task.id}` : `task-${task.id}`}
                            className="group flex flex-col rounded-xl border border-red-100 bg-white shadow-sm hover:shadow-md transition-all [&_summary::-webkit-details-marker]:hidden"
                          >
                            <summary className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer hover:bg-red-50/30">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{task.title} (Phiếu bài tập)</h4>
                                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                                    {task.items?.length || 0} bài tập
                                  </span>
                                </div>
                                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                  <AlertCircle className="h-3 w-3" />
                                  Hết hạn: {task.deadline ? formatDateTime(task.deadline) : 'Không có thời hạn'}
                                </span>
                              </div>
                              <div className="flex-shrink-0 self-start sm:self-center flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100">
                                Mở phiếu
                                <ChevronDown className="h-4 w-4 details-chevron transition-transform duration-300" />
                              </div>
                            </summary>
                            <div className="p-4 border-t border-red-50 bg-slate-50/30 space-y-3">
                              {task.items?.map((item: any, i: number) => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-100 bg-white p-3 shadow-sm hover:shadow-md transition-all">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{i + 1}. {item.title}</h4>
                                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
                                      {item.maxScore ?? 10} đ
                                    </span>
                                  </div>
                                  <Link
                                    href={`/assignments/${item.id}?classCode=${classCode}&from=class`}
                                    className="flex-shrink-0 self-start sm:self-center text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                                  >
                                    {(() => {
                                      if (item.submissionStatus === 'GRADED') return 'Xem điểm';
                                      if (item.submissionStatus === 'SUBMITTED' || item.submissionStatus === 'LATE') return 'Xem bài nộp';
                                      return 'Vẫn nộp bài';
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
                              Hết hạn: {task.deadline ? formatDateTime(task.deadline) : 'Không có thời hạn'}
                            </span>
                          </div>
                          <Link
                            href={`/assignments/${task.id}?classCode=${classCode}&from=class`}
                            className="flex-shrink-0 self-start sm:self-center text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                          >
                            Vẫn nộp bài
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                </details>
              )}

              {/* Completed Tasks (Accordion) */}
              <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Đã hoàn thành
                      <span className="ml-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5">
                        {completedTasks.length}
                      </span>
                    </h3>
                  </div>
                  <ChevronDown className="h-5 w-5 text-slate-400 details-chevron transition-transform duration-300" />
                </summary>
                <div className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-3">
                  {completedTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">Bạn chưa hoàn thành bài tập nào.</p>
                  ) : completedTasks.map((task) => {
                    if (task.isSheet) {
                      const isGraded = task.submissionStatus === 'GRADED';
                      const submittedAt = 'Đã hoàn thành'; // Sheets don't have a single submit time currently mapped, or use items' latest

                      const totalSheetScore = task.items?.reduce((sum: number, item: any) => sum + (item.submissionScore || 0), 0) || 0;
                      const allItemsGraded = task.items?.length > 0 && task.items.every((item: any) => item.submissionStatus === 'GRADED');

                      return (
                        <details
                          key={task.isSheet ? `sheet-${task.id}` : `task-${task.id}`}
                          className="group flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all [&_summary::-webkit-details-marker]:hidden"
                        >
                          <summary className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{task.title} (Phiếu bài tập)</h4>
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                                  {task.items?.length || 0} bài tập
                                </span>
                                {allItemsGraded && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                                    {totalSheetScore}/10 điểm
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[11px] text-slate-400">Đã nộp: {submittedAt}</p>
                            </div>
                            <div className="flex-shrink-0 self-start sm:self-center flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200">
                              Xem chi tiết
                              <ChevronDown className="h-4 w-4 details-chevron transition-transform duration-300" />
                            </div>
                          </summary>
                          <div className="p-4 border-t border-slate-100 bg-slate-50/30 space-y-3">
                            {task.items?.map((item: any, i: number) => {
                              const itemGraded = item.submissionStatus === 'GRADED';
                              const itemSubmittedAt = item.submission?.submittedAt ? formatDateTime(item.submission.submittedAt) : 'Chưa có thông tin';
                              return (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-all">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{i + 1}. {item.title}</h4>
                                      {itemGraded ? (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                                          {item.submissionScore ?? 0}/{item.maxScore ?? 10} điểm
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                                          Chờ chấm
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">Đã nộp: {itemSubmittedAt}</p>
                                  </div>
                                  <Link
                                    href={`/assignments/${item.id}?classCode=${classCode}&from=class`}
                                    className="flex-shrink-0 self-start sm:self-center text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                                  >
                                    Xem lại bài
                                  </Link>
                                </div>
                              )
                            })}
                          </div>
                        </details>
                      )
                    }

                    const isGraded = task.submission?.status === 'GRADED';
                    const submittedAt = task.submission?.submittedAt ? formatDateTime(task.submission.submittedAt) : 'Chưa có thông tin';

                    return (
                      <div key={task.isSheet ? `sheet-${task.id}` : `task-${task.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{task.title}</h4>
                            {isGraded ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                                {task.submission?.score}/{task.maxScore ?? 10} điểm
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                                Chờ chấm
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">Đã nộp: {submittedAt}</p>
                        </div>
                        <Link
                          href={`/assignments/${task.id}?classCode=${classCode}&from=class`}
                          className="flex-shrink-0 self-start sm:self-center text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                        >
                          Xem lại bài
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </details>

            </div>

            {/* ── Column 3 (Right 25%): Announcements Sidebar ── */}
            <div className="space-y-6 lg:col-span-1">

              {/* Old Announcements */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100">
                      <Bell className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-800">Thông báo khác</h2>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {oldAnnouncements.map((ann) => (
                    <div key={ann.id} className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                          {ann.initials}
                        </div>
                        <p className="text-xs font-bold text-slate-700">{ann.author}</p>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                        {ann.type === 'assignment' ? (
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <FileText className="h-3 w-3" /> {ann.content}
                          </span>
                        ) : (
                          ann.content
                        )}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[10px] text-slate-400">{ann.time}</p>

                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                  <button className="w-full text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors py-1.5">
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
