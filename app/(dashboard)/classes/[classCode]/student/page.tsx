'use client'

import React, { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  FileText,
  MessageSquare,
  BookOpen,
  AlertCircle,
  Calendar,
  GraduationCap,
  Users,
  Bell,
  Pin,
  ChevronRight,
  Flame,
  TrendingUp,
  Award,
} from 'lucide-react'
import api from '@/lib/axios'

interface PageProps {
  params: Promise<{ classCode: string }>
}

// ─── Mock Data ─────────────────────────────────────────────────────────────
const MOCK_STATS = [
  { label: 'Bài tập hoàn thành', value: '8/10', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { label: 'Điểm trung bình', value: '8.6', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Thứ hạng lớp', value: '#3', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
]

const MOCK_ANNOUNCEMENTS = [
  {
    id: 1,
    author: 'Thầy Nguyễn Trọng T.',
    initials: 'NT',
    time: 'Hôm qua',
    pinned: true,
    content:
      'Chào các em, tuần sau chúng ta sẽ có bài kiểm tra 1 tiết về phần Đạo hàm và Ứng dụng. Các em nhớ ôn tập kỹ lý thuyết chương 2 và làm đầy đủ các bài tập tự luyện trên hệ thống nhé. Chúc các em cuối tuần vui vẻ!',
    comments: 12,
  },
  {
    id: 2,
    author: 'Thầy Nguyễn Trọng T.',
    initials: 'NT',
    time: '2 ngày trước',
    pinned: false,
    type: 'assignment',
    content: 'đã đăng một bài tập mới: Đạo hàm cơ bản',
    comments: 5,
  },
]

const MOCK_DONE = [
  {
    id: 3,
    title: 'Kiểm tra 15 phút: Tổ hợp - Xác suất',
    submittedAt: 'Đã nộp lúc 10:45 - 20/05/2026',
    score: '9.0/10',
    status: 'graded',
  },
  {
    id: 4,
    title: 'Bài tập ôn tập: Lượng giác',
    submittedAt: 'Đã nộp bài tự luận',
    score: null,
    status: 'pending',
  },
]

// ─── Page ───────────────────────────────────────────────────────────────────
export default function StudentClassDetailPage({ params }: PageProps) {
  const { classCode } = use(params)
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<'stream' | 'classwork'>('stream')

  const [classroom, setClassroom] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true)
        const [classRes, assignRes] = await Promise.all([
          api.get(`/classrooms/${classCode}`),
          api.get(`/classrooms/${classCode}/assignments`, { params: { size: 100 } })
        ])
        setClassroom(classRes.data)
        const allAssignments = assignRes.data?.content || assignRes.data || []
        // Chỉ hiện bài tập đã giao
        setAssignments(allAssignments.filter((a: any) => a.status === 'PUBLISHED'))
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">

      {/* ── Hero Banner ── */}
      <div className={`relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 text-white`}>
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-screen-xl px-6 py-6">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách lớp
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                  <BookOpen className="h-3 w-3" />
                  Mã lớp: {classCode}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                  <Users className="h-3 w-3" />
                  {classroom?.studentCount || 0}/{classroom?.maxStudents || 0} học sinh
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {classroom?.className || 'Đang tải...'}
              </h1>

              {/* Teacher */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold backdrop-blur-sm border border-white/20">
                  {teacherInitials}
                </div>
                <div>
                  <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">Giáo viên phụ trách</p>
                  <p className="text-sm font-semibold">{teacherName}</p>
                </div>
              </div>
            </div>

            {/* Decorative icon */}
            <div className="hidden sm:flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
              <GraduationCap className="h-12 w-12 text-white/40" />
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {MOCK_STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <s.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-extrabold leading-none">{s.value}</p>
                  <p className="text-[11px] text-white/60 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab nav sits at the bottom of the hero */}
        <div className="relative z-10 mx-auto max-w-screen-xl px-6">
          <div className="flex gap-1 border-b border-white/20">
            {(['stream', 'classwork'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-white text-white'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                {tab === 'stream' ? '📌 Bảng tin' : '📝 Bài tập'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-xl px-6 py-8">

          {activeTab === 'stream' && (
            <div className="grid gap-6 lg:grid-cols-3">

              {/* ── Sidebar ── */}
              <div className="space-y-4 lg:col-span-1">
                {/* Upcoming tasks widget */}
                <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                      <Flame className="h-4 w-4 text-orange-500" />
                    </div>
                    <h2 className="text-sm font-bold text-foreground">Nhiệm vụ tuần này</h2>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/50 p-3">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-red-700">Sắp hết hạn</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">Đạo hàm cơ bản</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3 inline mr-1" />
                          23:59 - Chủ Nhật
                        </p>
                      </div>
                    </div>
                    <button className="w-full flex items-center justify-between rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors">
                      Xem tất cả bài tập
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Calendar widget */}
                <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <h2 className="text-sm font-bold text-foreground">Lịch học</h2>
                  </div>
                  <div className="p-4 text-center py-8">
                    <p className="text-xs text-muted-foreground">Thứ Hai, Thứ Tư, Thứ Sáu</p>
                    <p className="text-sm font-semibold mt-1">7:30 — 9:00</p>
                  </div>
                </div>
              </div>

              {/* ── Announcements Feed ── */}
              <div className="space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    Thông báo mới nhất
                  </h2>
                </div>

                {MOCK_ANNOUNCEMENTS.map((ann) => (
                  <div
                    key={ann.id}
                    className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Post header */}
                    <div className="flex items-start gap-3 p-5">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold">
                        {ann.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-foreground">{ann.author}</p>
                          {ann.pinned && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              <Pin className="h-2.5 w-2.5" />
                              Đã ghim
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{ann.time}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-5 pb-4">
                      {ann.type === 'assignment' ? (
                        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <p className="text-sm text-foreground">
                            <span className="text-muted-foreground">{ann.content}</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground leading-relaxed bg-slate-50 rounded-xl p-4">
                          {ann.content}
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-4 border-t border-border px-5 py-3">
                      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {ann.comments} bình luận
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'classwork' && (
            <div className="space-y-8">

              {/* ── To-do ── */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Bài tập được giao
                    <span className="ml-2 rounded-full bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5">
                      {assignments.length}
                    </span>
                  </h3>
                </div>

                <div className="grid gap-3">
                  {loading ? (
                    <div className="text-sm text-muted-foreground">Đang tải...</div>
                  ) : assignments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Chưa có bài tập nào được giao.</div>
                  ) : assignments.map((task) => (
                    <div
                      key={task.id}
                      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100`}
                        >
                          <FileText
                            className={`h-5 w-5 text-blue-600`}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{task.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{task.description || 'Không có mô tả'}</p>
                          <span
                            className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-1 bg-blue-50 text-blue-600`}
                          >
                            <Clock className="h-3 w-3" />
                            Hết hạn: {task.deadline ? new Date(task.deadline).toLocaleString('vi-VN') : 'Không có thời hạn'}
                          </span>
                        </div>
                      </div>
                      <button className="flex-shrink-0 self-end sm:self-auto flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-[.98]">
                        Làm bài ngay
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Done ── */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Đã hoàn thành
                    <span className="ml-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5">
                      {MOCK_DONE.length}
                    </span>
                  </h3>
                </div>

                <div className="grid gap-3">
                  {MOCK_DONE.map((task) => (
                    <div
                      key={task.id}
                      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 opacity-80 hover:opacity-100 border-l-4 ${
                        task.status === 'graded' ? 'border-l-emerald-500' : 'border-l-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl ${
                            task.status === 'graded' ? 'bg-emerald-100' : 'bg-slate-100'
                          }`}
                        >
                          <FileText
                            className={`h-5 w-5 ${
                              task.status === 'graded' ? 'text-emerald-600' : 'text-slate-500'
                            }`}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{task.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{task.submittedAt}</p>
                          {task.score ? (
                            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                              <Award className="h-3 w-3" />
                              Điểm: {task.score}
                            </span>
                          ) : (
                            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                              <Clock className="h-3 w-3" />
                              Đang chờ chấm
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="flex-shrink-0 self-end sm:self-auto rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-colors">
                        {task.status === 'graded' ? 'Xem lời phê & Đáp án' : 'Xem bài đã nộp'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
