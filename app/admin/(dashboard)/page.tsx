'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { adminDashboardService } from '@/services/adminDashboardService'
import { AdminKpiCards } from '@/components/admin/dashboard/AdminKpiCards'
import { AiDistributionDonutChart } from '@/components/admin/dashboard/AiDistributionDonutChart'
import { CreditPackageSalesCard } from '@/components/admin/dashboard/CreditPackageSalesCard'
import { RecentTransactionsCard } from '@/components/admin/dashboard/RecentTransactionsCard'
import { RecentSystemLogsCard } from '@/components/admin/dashboard/RecentSystemLogsCard'
import { RecentBugReportsCard } from '@/components/admin/dashboard/RecentBugReportsCard'
import { MonthYearSelector } from '@/components/admin/dashboard/MonthYearSelector'
import { AnnualTrendCards } from '@/components/admin/dashboard/AnnualTrendCards'
import { AdminDashboardSkeleton } from '@/components/admin/dashboard/AdminDashboardSkeleton'
import { Button } from '@/components/ui/button'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const hasPermission = !user?.permissions || user.permissions.includes('dashboard:admin_view')

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['adminDashboardStats', selectedMonth, selectedYear],
    queryFn: () => adminDashboardService.getStats(selectedMonth, selectedYear),
    staleTime: 60 * 1000,
    enabled: hasPermission,
  })

  const handlePeriodChange = (month: number, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
  }

  // 1. Kiểm tra phân quyền động: Người dùng thiếu quyền dashboard:admin_view
  if (user && user.permissions && !user.permissions.includes('dashboard:admin_view')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Không có quyền truy cập
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
          Tài khoản quản trị viên của bạn chưa được cấp quyền{' '}
          <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">
            dashboard:admin_view
          </code>{' '}
          để xem Trung tâm tổng quan. Vui lòng liên hệ quản trị viên cấp cao để kích hoạt.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/admin/users">
            <Button variant="default" className="rounded-xl text-xs font-semibold">
              Quản lý người dùng
            </Button>
          </Link>
          <Link href="/admin/roles">
            <Button variant="outline" className="rounded-xl text-xs font-semibold">
              Quản lý quyền hạn
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading && !data) {
    return <AdminDashboardSkeleton />
  }

  if (error || !data) {
    const errorMessage =
      (error as any)?.response?.data?.message ||
      (error as Error)?.message ||
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền.'

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 mb-4">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Không thể tải dữ liệu thống kê
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-md">
          {errorMessage}
        </p>
        <Button
          onClick={() => refetch()}
          className="mt-4 rounded-xl inline-flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Thử lại ngay
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto transition-opacity duration-200 ${
        isFetching ? 'opacity-80' : 'opacity-100'
      }`}
    >
      {/* Top Welcome Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Bảng Điều Khiển Quản Trị
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Trung Tâm Tổng Quan MathClass
            <Sparkles className="h-5 w-5 text-amber-500" />
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Báo cáo số liệu kỳ <span className="font-semibold text-foreground">Tháng {selectedMonth}/{selectedYear}</span> về người dùng, lớp học, doanh thu và lưu lượng AI.
          </p>
        </div>

        {/* Bộ chọn Tháng / Năm & Nút Refresh */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <MonthYearSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onChange={handlePeriodChange}
            disabled={isFetching}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold h-9"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
            />
            {isFetching ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
      </div>

      {/* 1. Hàng KPI Cards (4 Thẻ chỉ số chính) */}
      <AdminKpiCards
        userStats={data.userStats}
        classroomStats={data.classroomStats}
        revenueStats={data.revenueStats}
        bugReportStats={data.bugReportStats}
      />

      {/* 2. Hàng Biểu Đồ Xu Hướng Năm (Tia mảnh 12 tháng: Người dùng & Doanh thu) */}
      <AnnualTrendCards
        userTrends={data.userTrends}
        revenueTrends={data.revenueTrends}
        year={selectedYear}
      />

      {/* 3. Bento Middle: Biểu đồ tròn AI (2/3) + Thống kê Gói nạp (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AiDistributionDonutChart aiTaskUsages={data.aiTaskUsages} />
        </div>
        <div className="lg:col-span-1">
          <CreditPackageSalesCard packageSales={data.packageSales} />
        </div>
      </div>

      {/* 3. Bottom: Bảng Lịch Sử Nạp Tiền Có Phân Trang Trực Tiếp */}
      <RecentTransactionsCard recentTransactions={data.recentTransactions} />

      {/* 4. Bottom: 2 Bảng Xem Trước Ghi Log Hệ Thống và Báo Cáo Sự Cố Trên Cùng 1 Hàng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentSystemLogsCard logs={data.recentSystemLogs} />
        <RecentBugReportsCard reports={data.recentBugReports} />
      </div>
    </div>
  )
}
