import React from 'react'
import Link from 'next/link'
import {
  Users,
  School,
  Banknote,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Flame,
  ArrowUpRight,
} from 'lucide-react'
import { UserStats, ClassroomStats, RevenueStats, BugReportStats } from '@/types/admin-dashboard'

interface AdminKpiCardsProps {
  userStats: UserStats
  classroomStats: ClassroomStats
  revenueStats: RevenueStats
  bugReportStats: BugReportStats
}

export function AdminKpiCards({
  userStats,
  classroomStats,
  revenueStats,
  bugReportStats,
}: AdminKpiCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Người dùng & Hoạt động */}
      <div className="relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Người dùng & Hoạt động
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {userStats.totalUsers.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">tài khoản</span>
        </div>

        {/* Phân loại GV / HS */}
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {userStats.teacherCount} Giáo viên
          </span>
          <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            {userStats.studentCount} Học sinh
          </span>
        </div>

        {/* Chỉ số phụ: Mới trong tháng & DAU */}
        <div className="mt-3.5 flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <UserPlus className="h-3.5 w-3.5" /> +{userStats.newUsersInMonth ?? userStats.newUsersThisWeek ?? 0} trong tháng
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" /> {userStats.activeUsersToday > 0 ? `${userStats.activeUsersToday} truy cập hôm nay` : '- truy cập hôm nay'}
          </span>
        </div>
      </div>

      {/* 2. Hệ thống Lớp học */}
      <div className="relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Hệ thống Lớp học
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <School className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {classroomStats.activeClassesCount.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">lớp học đang mở</span>
        </div>

        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Không gian học tập và làm bài trực tuyến được khởi tạo bởi các giáo viên.
        </p>
      </div>

      {/* 3. Doanh thu Nạp Credit */}
      <div className="relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Doanh thu Nạp Tháng
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Banknote className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {formatCurrency(revenueStats.monthlyRevenue)}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
              revenueStats.growthPercentage >= 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {revenueStats.growthPercentage >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {revenueStats.growthPercentage >= 0 ? '+' : ''}
            {revenueStats.growthPercentage}%
          </span>
          <span className="text-xs text-muted-foreground">so với tháng trước</span>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
          <span>Lượt mua:</span>
          <span className="font-semibold text-foreground">
            {revenueStats.successfulOrdersCount} lượt
          </span>
        </div>
      </div>

      {/* 4. Báo cáo Sự cố */}
      <div className="relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Báo cáo Sự cố
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {bugReportStats.pendingCount.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">chờ xử lý</span>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {bugReportStats.pendingCount > 0
            ? 'Cần quản trị viên kiểm tra và phản hồi người dùng.'
            : 'Hệ thống vận hành trơn tru, không có sự cố tồn đọng.'}
        </p>

        <div className="mt-3.5 flex items-center justify-between border-t pt-2.5 text-xs">
          <span className="text-muted-foreground">Hành động:</span>
          <Link
            href="/admin/bug-reports"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Xem danh sách <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
