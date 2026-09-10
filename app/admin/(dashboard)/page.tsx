'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  LayoutDashboard,
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
  const { user, isInitializing } = useAuth()
  const hasAdminDashboardPermission = !!user?.permissions?.includes('dashboard:admin_view')

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
    enabled: !isInitializing && hasAdminDashboardPermission,
  })

  const handlePeriodChange = (month: number, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
  }

  // 1. Khi đang nạp trạng thái xác thực
  if (isInitializing) {
    return <AdminDashboardSkeleton />
  }

  // 2. Kiểm tra phân quyền động: Người dùng thiếu quyền dashboard:admin_view
  if (!hasAdminDashboardPermission) {
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
          <Button variant="default" asChild className="rounded-xl text-xs font-semibold">
            <Link href="/admin/users">
              Quản lý người dùng
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-xl text-xs font-semibold">
            <Link href="/admin/roles">
              Quản lý quyền hạn
            </Link>
          </Button>
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
      className={`flex-1 flex flex-col overflow-hidden bg-slate-50/50 transition-opacity duration-200 ${
        isFetching ? 'opacity-80' : 'opacity-100'
      }`}
    >
      {/* ── Synchronized Header Bar ─────────────────────────────────────────────── */}
      <div className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-screen-xl px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <LayoutDashboard className="h-5.5 w-5.5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Trung Tâm Tổng Quan Math Class
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Báo cáo số liệu kỳ <span className="font-semibold text-foreground">Tháng {selectedMonth}/{selectedYear}</span>.
            </p>
          </div>

          {/* Bộ chọn Tháng / Năm & Nút Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
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
              className="rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold h-9 bg-white"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
              />
              {isFetching ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main Scroll Area ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-screen-xl px-6 py-8 space-y-6">
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

          {/* 4. Bottom: Bảng Lịch Sử Nạp Tiền Có Phân Trang Trực Tiếp */}
          <RecentTransactionsCard recentTransactions={data.recentTransactions} />

          {/* 5. Bottom: 2 Bảng Xem Trước Ghi Log Hệ Thống và Báo Cáo Sự Cố Trên Cùng 1 Hàng */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentSystemLogsCard logs={data.recentSystemLogs} />
            <RecentBugReportsCard reports={data.recentBugReports} />
          </div>
        </div>
      </div>
    </div>
  )
}
