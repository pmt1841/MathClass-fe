'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen,
  ClipboardList,
  TrendingUp,
  Clock,
  PlusCircle,
} from 'lucide-react'
import { CreateClassModal } from '@/components/dashboard/create-class-modal'
import { StatCard, StatCardProps } from '@/components/dashboard/stat-card'
import { RecentActivity, RecentActivityList } from './recent-activity-list'
import { QuickActions } from './quick-actions'

interface UserInfo {
  fullName?: string
  email?: string
  role?: string
  userRole?: string
}

const teacherStats: StatCardProps[] = [
  { label: 'Lớp đang dạy', value: 4, icon: BookOpen, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Tổng học sinh', value: 87, icon: ClipboardList, color: 'text-accent', bgColor: 'bg-accent/10' },
  { label: 'Bài tập đã giao', value: 23, icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
  { label: 'Chờ chấm điểm', value: 12, icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50' },
]

const studentStats: StatCardProps[] = [
  { label: 'Lớp đang học', value: 3, icon: BookOpen, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Bài tập cần nộp', value: 5, icon: ClipboardList, color: 'text-accent', bgColor: 'bg-accent/10' },
  { label: 'Điểm trung bình', value: '8.5', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
  { label: 'Chuỗi ngày học', value: '7 ngày', icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50' },
]

const teacherActivities: RecentActivity[] = [
  { id: 1, title: 'Học sinh Nguyễn Văn A nộp bài Chương 3', time: '5 phút trước', type: 'assignment', status: 'pending' },
  { id: 2, title: 'Tạo bài tập mới: Phương trình bậc hai', time: '2 giờ trước', type: 'assignment', status: 'done' },
  { id: 3, title: 'Lớp Toán 10A - 3 học sinh mới tham gia', time: 'Hôm qua', type: 'class', status: 'done' },
  { id: 4, title: '5 học sinh đã nộp bài Chương 2', time: 'Hôm qua', type: 'grade', status: 'pending' },
]

const studentActivities: RecentActivity[] = [
  { id: 1, title: 'Bài tập Phương trình bậc hai - Hạn nộp hôm nay', time: '23 giờ còn lại', type: 'assignment', status: 'pending' },
  { id: 2, title: 'Điểm bài kiểm tra Chương 2: 9/10', time: '1 giờ trước', type: 'grade', status: 'done' },
  { id: 3, title: 'Đã tham gia lớp Hình học 11B', time: 'Hôm qua', type: 'class', status: 'done' },
  { id: 4, title: 'Bài tập Tích phân - Hạn nộp ngày mai', time: '1 ngày còn lại', type: 'assignment', status: 'pending' },
]

export default function HomePageContent() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [createClassOpen, setCreateClassOpen] = useState(false)

  useEffect(() => {
    const stored =
      localStorage.getItem('user_info') ||
      sessionStorage.getItem('user_info')
    if (stored) {
      try { setUserInfo(JSON.parse(stored)) } catch {}
    }
  }, [])

  const role = userInfo?.role || userInfo?.userRole
  const isTeacher = role === 'TEACHER'
  const displayName = userInfo?.fullName || userInfo?.email || 'bạn'
  const stats = isTeacher ? teacherStats : studentStats
  const activities = isTeacher ? teacherActivities : studentActivities

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Chào buổi sáng'
    if (h < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-8">
          
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">{greeting()},</p>
                <h1 className="text-3xl font-bold text-primary-foreground mt-1">{displayName} 👋</h1>
                <p className="text-primary-foreground/70 mt-2 text-sm">
                  {isTeacher
                    ? 'Quản lý lớp học và theo dõi tiến độ học sinh của bạn.'
                    : 'Tiếp tục hành trình học toán của bạn hôm nay!'}
                </p>
              </div>
              {isTeacher && (
                <button
                  id="welcome-create-class-btn"
                  onClick={() => setCreateClassOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  <PlusCircle className="h-4 w-4" />
                  Tạo lớp học mới
                </button>
              )}
              {!isTeacher && (
                <div className="flex flex-col items-center justify-center rounded-xl bg-white/10 px-6 py-4 text-center">
                  <span className="text-3xl font-bold text-primary-foreground">7</span>
                  <span className="text-xs text-primary-foreground/70 mt-1">Ngày học liên tiếp 🔥</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            <RecentActivityList activities={activities} />
            <QuickActions 
              isTeacher={isTeacher} 
              onCreateClass={() => setCreateClassOpen(true)} 
            />
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      <CreateClassModal
        open={createClassOpen}
        onClose={() => setCreateClassOpen(false)}
        onSuccess={(data) => {
          console.log('Class created:', data)
          setCreateClassOpen(false)
        }}
      />
    </>
  )
}
