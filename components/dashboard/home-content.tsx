'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen,
  ClipboardList,
  TrendingUp,
  Clock,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { CreateClassModal } from '@/components/dashboard/create-class-modal'

interface UserInfo {
  fullName?: string
  email?: string
  role?: string
  userRole?: string
}

interface StatCard {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  bgColor: string
}

interface RecentActivity {
  id: number
  title: string
  time: string
  type: 'class' | 'assignment' | 'grade'
  status?: 'done' | 'pending'
}

const teacherStats: StatCard[] = [
  { label: 'Lớp đang dạy', value: 4, icon: BookOpen, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Tổng học sinh', value: 87, icon: ClipboardList, color: 'text-accent', bgColor: 'bg-accent/10' },
  { label: 'Bài tập đã giao', value: 23, icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
  { label: 'Chờ chấm điểm', value: 12, icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50' },
]

const studentStats: StatCard[] = [
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
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div key={idx} className="rounded-xl bg-white border border-border p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Activity */}
            <div className="lg:col-span-2 rounded-xl bg-white border border-border overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-bold text-foreground">Hoạt động gần đây</h2>
                <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                  Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="divide-y divide-border">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="mt-0.5 flex-shrink-0">
                      {activity.status === 'done' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      activity.type === 'class'
                        ? 'bg-primary/10 text-primary'
                        : activity.type === 'assignment'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-green-50 text-green-600'
                    }`}>
                      {activity.type === 'class' ? 'Lớp học' : activity.type === 'assignment' ? 'Bài tập' : 'Điểm số'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl bg-white border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-bold text-foreground">Thao tác nhanh</h2>
              </div>
              <div className="p-4 space-y-2">
                {isTeacher ? (
                  <>
                    <button
                      onClick={() => setCreateClassOpen(true)}
                      className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-primary/30 p-4 text-left hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <PlusCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Tạo lớp học</p>
                        <p className="text-xs text-muted-foreground">Mở lớp học mới</p>
                      </div>
                    </button>
                    <QuickActionLink href="/assignments/create" icon={ClipboardList} label="Giao bài tập" desc="Tạo bài tập mới" color="accent" />
                    <QuickActionLink href="/students" icon={BookOpen} label="Quản lý học sinh" desc="Xem danh sách" color="green" />
                    <QuickActionLink href="/reports" icon={TrendingUp} label="Xem báo cáo" desc="Thống kê lớp học" color="orange" />
                  </>
                ) : (
                  <>
                    <QuickActionLink href="/assignments/submit" icon={ClipboardList} label="Nộp bài tập" desc="Nộp bài đang làm" color="accent" />
                    <QuickActionLink href="/classes" icon={BookOpen} label="Vào lớp học" desc="Xem bài học mới" color="primary" />
                    <QuickActionLink href="/assignments" icon={TrendingUp} label="Xem điểm số" desc="Kết quả bài làm" color="green" />
                    <QuickActionLink href="/profile" icon={Clock} label="Lịch sử học tập" desc="Theo dõi tiến độ" color="orange" />
                  </>
                )}
              </div>
            </div>
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

function QuickActionLink({
  href,
  icon: Icon,
  label,
  desc,
  color,
}: {
  href: string
  icon: React.ElementType
  label: string
  desc: string
  color: string
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'bg-primary/10 group-hover:bg-primary/20', text: 'text-primary' },
    accent: { bg: 'bg-accent/10 group-hover:bg-accent/20', text: 'text-accent' },
    green: { bg: 'bg-green-50 group-hover:bg-green-100', text: 'text-green-600' },
    orange: { bg: 'bg-orange-50 group-hover:bg-orange-100', text: 'text-orange-500' },
  }
  const c = colorMap[color] || colorMap.primary

  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-xl p-4 hover:bg-muted/50 transition-colors group"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${c.bg}`}>
        <Icon className={`h-5 w-5 ${c.text}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  )
}
