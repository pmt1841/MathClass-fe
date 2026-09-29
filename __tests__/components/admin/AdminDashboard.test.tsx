import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AdminKpiCards } from '@/components/admin/dashboard/AdminKpiCards'
import { AiDistributionDonutChart } from '@/components/admin/dashboard/AiDistributionDonutChart'
import { CreditPackageSalesCard } from '@/components/admin/dashboard/CreditPackageSalesCard'
import { RecentTransactionsCard } from '@/components/admin/dashboard/RecentTransactionsCard'
import { RecentSystemLogsCard } from '@/components/admin/dashboard/RecentSystemLogsCard'
import { RecentBugReportsCard } from '@/components/admin/dashboard/RecentBugReportsCard'
import { MonthYearSelector } from '@/components/admin/dashboard/MonthYearSelector'
import { AnnualTrendCards } from '@/components/admin/dashboard/AnnualTrendCards'
import { AdminDashboardStats } from '@/types/admin-dashboard'

// Mock react-query hook dùng trong CreditTransactionsTable nếu modal mở
vi.mock('@/hooks/useCredits', () => ({
  useMyCreditTransactions: () => ({
    data: { content: [], totalPages: 0, totalElements: 0 },
    isLoading: false,
    isFetching: false,
  }),
}))

// Mock useI18n: t() trả về key gốc và xử lý interpolation đơn giản
vi.mock('@/lib/i18n/i18n-context', () => ({
  useI18n: () => ({
    t: (key: string, vars?: Record<string, string | number>) => {
      if (!vars) return key
      // Thực hiện simple interpolation: thay {varName} bằng giá trị tương ứng
      return Object.entries(vars).reduce(
        (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
        key
      )
    },
    locale: 'vi',
  }),
}))

const mockStats: AdminDashboardStats = {
  recentSystemLogs: [
    {
      id: 1,
      actor: 'admin@mathclass.edu.vn',
      resourceType: 'USER',
      action: 'Cập nhật phân quyền giảng viên',
      level: 'INFO',
      createdAt: '2026-09-09T10:00:00.000Z',
    },
  ],
  recentBugReports: [
    {
      id: 1,
      reporterEmail: 'hocsinh@mathclass.edu.vn',
      errorType: 'SUBMISSION_PROBLEM',
      description: 'Không tải được file bài nộp',
      status: 'PENDING',
      createdAt: '2026-09-09T11:00:00.000Z',
    },
  ],
  userStats: {
    totalUsers: 1250,
    teacherCount: 180,
    studentCount: 1070,
    newUsersInMonth: 45,
    newUsersThisWeek: 45,
    activeUsersToday: 130,
  },
  classroomStats: {
    activeClassesCount: 52,
  },
  revenueStats: {
    monthlyRevenue: 15500000,
    growthPercentage: 18.5,
    successfulOrdersCount: 88,
  },
  bugReportStats: {
    pendingCount: 5,
  },
  aiTaskUsages: [
    {
      taskCode: 'BATCH_QUESTION_GEN',
      taskName: 'AI Tách đề thi',
      callCount: 500,
      successCount: 490,
      failedCount: 10,
      successRate: 98.0,
      percentage: 33.3,
    },
    {
      taskCode: 'QUESTION_GEN',
      taskName: 'AI Sinh đề & câu hỏi',
      callCount: 400,
      successCount: 396,
      failedCount: 4,
      successRate: 99.0,
      percentage: 26.7,
    },
    {
      taskCode: 'SUBMISSION_GRADING',
      taskName: 'AI Chấm bài tự động',
      callCount: 300,
      successCount: 290,
      failedCount: 10,
      successRate: 96.7,
      percentage: 20.0,
    },
    {
      taskCode: 'STUDENT_HINT',
      taskName: 'AI Gợi ý giải bài',
      callCount: 150,
      successCount: 148,
      failedCount: 2,
      successRate: 98.7,
      percentage: 10.0,
    },
    {
      taskCode: 'STUDENT_REMARK',
      taskName: 'AI Nhận xét học sinh',
      callCount: 100,
      successCount: 99,
      failedCount: 1,
      successRate: 99.0,
      percentage: 6.7,
    },
    {
      taskCode: 'CANVAS_LATEX',
      taskName: 'AI Nhận diện hình ảnh & viết tay',
      callCount: 50,
      successCount: 45,
      failedCount: 5,
      successRate: 90.0,
      percentage: 3.3,
    },
  ],
  packageSales: [
    {
      packageId: 1,
      packageName: 'Gói Khởi Động',
      credits: 100,
      price: 20000,
      salesCount: 45,
    },
    {
      packageId: 2,
      packageName: 'Gói Tiêu Chuẩn',
      credits: 600,
      price: 100000,
      salesCount: 30,
    },
  ],
  recentTransactions: [
    {
      orderId: 101,
      userId: 1,
      fullName: 'Thầy Hoàng Nam',
      avatarUrl: null,
      role: 'TEACHER',
      packageName: 'Gói Tiêu Chuẩn',
      price: 100000,
      credits: 600,
      status: 'SUCCESS',
      paidAt: '2026-09-08T14:30:00',
    },
  ],
  userTrends: [
    { month: 1, count: 20 },
    { month: 2, count: 25 },
    { month: 3, count: 30 },
    { month: 4, count: 45 },
    { month: 5, count: 60 },
    { month: 6, count: 50 },
    { month: 7, count: 40 },
    { month: 8, count: 70 },
    { month: 9, count: 85 },
    { month: 10, count: 0 },
    { month: 11, count: 0 },
    { month: 12, count: 0 },
  ],
  revenueTrends: [
    { month: 1, revenue: 2000000 },
    { month: 2, revenue: 3500000 },
    { month: 3, revenue: 5000000 },
    { month: 4, revenue: 8000000 },
    { month: 5, revenue: 12000000 },
    { month: 6, revenue: 10000000 },
    { month: 7, revenue: 7500000 },
    { month: 8, revenue: 14000000 },
    { month: 9, revenue: 15500000 },
    { month: 10, revenue: 0 },
    { month: 11, revenue: 0 },
    { month: 12, revenue: 0 },
  ],
}

describe('Admin Dashboard Components', () => {
  it('AdminKpiCards: Hiển thị chuẩn xác 4 thẻ KPI chỉ số tổng quan', () => {
    render(
      <AdminKpiCards
        userStats={mockStats.userStats}
        classroomStats={mockStats.classroomStats}
        revenueStats={mockStats.revenueStats}
        bugReportStats={mockStats.bugReportStats}
      />
    )

    // Kiểm tra thẻ người dùng
    expect(screen.getByText(/1[.,]250/)).toBeDefined()
    expect(screen.getByText(/180/)).toBeDefined()
    expect(screen.getByText(/1070/)).toBeDefined()
    expect(screen.getByText(/45 trong tháng/)).toBeDefined()
    expect(screen.getByText(/130 truy cập hôm nay/)).toBeDefined()

    // Kiểm tra thẻ lớp học
    expect(screen.getByText('52')).toBeDefined()
    expect(screen.getByText('lớp học đang mở')).toBeDefined()

    // Kiểm tra thẻ doanh thu
    expect(screen.getByText(/18.5%/)).toBeDefined()
    expect(screen.getByText(/88 lượt/)).toBeDefined()

    // Kiểm tra thẻ bug report
    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText('chờ xử lý')).toBeDefined()
  })

  it('AiDistributionDonutChart: Hiển thị đầy đủ các con AI và tỷ lệ %', () => {
    render(<AiDistributionDonutChart aiTaskUsages={mockStats.aiTaskUsages} />)

    // Header title (dùng t() nhưng mock trả về key → kiểm tra key)
    expect(screen.getByText('Phân Bổ Lượt Dùng AI')).toBeDefined()

    // taskName render từ CREDIT_TASK_LABELS (vì t() trả về key → getCreditTaskLabel fallback)
    expect(screen.getByText('AI tách đề')).toBeDefined()
    expect(screen.getByText('Sinh đề')).toBeDefined()
    expect(screen.getByText('Chấm bài tự động')).toBeDefined()
    expect(screen.getByText('Gợi ý tư duy làm bài')).toBeDefined()
    expect(screen.getByText('AI Đánh giá & Nhận xét học sinh')).toBeDefined()
    expect(screen.getByText('Trợ lý AI Canvas (Chữ viết tay & Phác thảo)')).toBeDefined()

    // Tỷ lệ % tính từ callCount (không phụ thuộc i18n)
    expect(screen.getByText('33.3%')).toBeDefined()
  })

  it('CreditPackageSalesCard: Hiển thị bảng xếp hạng độ phổ biến gói credit', () => {
    render(<CreditPackageSalesCard packageSales={mockStats.packageSales} />)

    expect(screen.getByText('Thống Kê Lượt Mua Gói Credit')).toBeDefined()
    expect(screen.getByText('Gói Khởi Động')).toBeDefined()
    expect(screen.getByText('45 lượt')).toBeDefined()
    expect(screen.getByText('Gói Tiêu Chuẩn')).toBeDefined()
    expect(screen.getByText('30 lượt')).toBeDefined()
  })

  it('RecentTransactionsCard: Hiển thị toàn bộ đơn nạp tiền với phân trang trực tiếp', () => {
    render(
      <RecentTransactionsCard
        recentTransactions={mockStats.recentTransactions}
      />
    )

    expect(screen.getByText('Lịch Sử Nạp Tiền')).toBeDefined()
    expect(screen.getByText('Thầy Hoàng Nam')).toBeDefined()
    expect(screen.getByText('Giáo viên')).toBeDefined()
    expect(screen.getByText('+600')).toBeDefined()
    expect(screen.queryByText('Trạng Thái')).toBeNull() // Đã lược bỏ cột trạng thái
    expect(screen.queryByText('Thành công')).toBeNull()
    expect(screen.getByText(/Hiển thị Trang/)).toBeDefined()
  })

  it('MonthYearSelector: Cho phép chọn tháng và năm của quá khứ', () => {
    const handleChange = vi.fn()
    const { rerender } = render(
      <MonthYearSelector
        selectedMonth={8}
        selectedYear={2026}
        onChange={handleChange}
      />
    )

    // Kiểm tra dropdown tháng và năm
    const monthSelect = screen.getByLabelText('Chọn tháng báo cáo') as HTMLSelectElement
    const yearSelect = screen.getByLabelText('Chọn năm báo cáo') as HTMLSelectElement

    expect(monthSelect.value).toBe('8')
    expect(yearSelect.value).toBe('2026')

    // Thay đổi tháng
    fireEvent.change(monthSelect, { target: { value: '5' } })
    expect(handleChange).toHaveBeenCalledWith(5, 2026)

    // Thay đổi năm
    fireEvent.change(yearSelect, { target: { value: '2025' } })
    expect(handleChange).toHaveBeenCalledWith(8, 2025)

    // Khi chọn tháng quá khứ (ví dụ tháng 1 năm 2025), nút Về tháng hiện tại phải xuất hiện
    rerender(
      <MonthYearSelector
        selectedMonth={1}
        selectedYear={2025}
        onChange={handleChange}
      />
    )
    const resetBtn = screen.getByText(/Về tháng hiện tại/)
    expect(resetBtn).toBeDefined()
    fireEvent.click(resetBtn)
    expect(handleChange).toHaveBeenCalled()
  })

  it('AnnualTrendCards: Hiển thị 2 biểu đồ tia mảnh 12 tháng mở rộng, không còn số tổng góc', () => {
    render(
      <AnnualTrendCards
        userTrends={mockStats.userTrends}
        revenueTrends={mockStats.revenueTrends}
        year={2026}
      />
    )

    // 1. Kiểm tra tiêu đề 2 biểu đồ (t() được mock interpolate {year} → 2026)
    expect(screen.getByText(/Tăng Trưởng Đăng Ký Năm 2026/)).toBeDefined()
    expect(screen.getByText(/Xu Hướng Doanh Thu Năm 2026/)).toBeDefined()

    // 2. Kiểm tra tag 12 Tháng xuất hiện (thay vì số tổng ở góc)
    expect(screen.getAllByText('12 Tháng').length).toBe(2)

    // 3. Kiểm tra số tổng cũ không còn tồn tại ở header
    expect(screen.queryByText('425 tài khoản')).toBeNull()

    // 4. Kiểm tra hiển thị các mốc tháng
    expect(screen.getAllByText('T1').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('T6').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('T12').length).toBeGreaterThanOrEqual(2)
  })

  it('RecentSystemLogsCard: Hiển thị 5 nhật ký gần nhất và nút Xem chi tiết sang /admin/logs', () => {
    render(<RecentSystemLogsCard logs={mockStats.recentSystemLogs} />)

    expect(screen.getByText('Nhật Ký Hệ Thống')).toBeDefined()
    expect(screen.getByText('admin@mathclass.edu.vn')).toBeDefined()
    expect(screen.getByText('Người dùng')).toBeDefined()
    expect(screen.getByText('Cập nhật phân quyền giảng viên')).toBeDefined()
    const link = screen.getByRole('link', { name: /xem chi tiết/i })
    expect(link.getAttribute('href')).toBe('/admin/logs')
  })

  it('RecentBugReportsCard: Hiển thị 5 báo cáo sự cố gần nhất và nút Xem chi tiết sang /admin/bug-reports', () => {
    render(<RecentBugReportsCard reports={mockStats.recentBugReports} />)

    expect(screen.getByText('Báo Cáo Sự Cố')).toBeDefined()
    expect(screen.getByText('hocsinh@mathclass.edu.vn')).toBeDefined()
    expect(screen.getByText('SUBMISSION_PROBLEM')).toBeDefined()
    expect(screen.getByText('Chờ xử lý')).toBeDefined()
    const link = screen.getByRole('link', { name: /xem chi tiết/i })
    expect(link.getAttribute('href')).toBe('/admin/bug-reports')
  })
})
