import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdminDashboardPage from '@/app/admin/(dashboard)/page'
import { adminDashboardService } from '@/services/adminDashboardService'
import { AdminDashboardStats } from '@/types/admin-dashboard'

// Mock useAuth
const mockAuthState = {
  user: null as any,
  isAuthenticated: false,
  isInitializing: false,
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}))

// Mock adminDashboardService
vi.mock('@/services/adminDashboardService', () => ({
  adminDashboardService: {
    getStats: vi.fn(),
  },
}))

// Mock AdminDashboardSkeleton
vi.mock('@/components/admin/dashboard/AdminDashboardSkeleton', () => ({
  AdminDashboardSkeleton: () => (
    <div data-testid="admin-dashboard-skeleton">Admin Dashboard Skeleton</div>
  ),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockStats: AdminDashboardStats = {
  userStats: {
    totalUsers: 100,
    teacherCount: 10,
    studentCount: 90,
    newUsersInMonth: 12,
    newUsersThisWeek: 5,
    activeUsersToday: 20,
  },
  classroomStats: {
    activeClassesCount: 15,
  },
  revenueStats: {
    monthlyRevenue: 5000000,
    growthPercentage: 10.0,
    successfulOrdersCount: 25,
  },
  bugReportStats: {
    pendingCount: 2,
  },
  aiTaskUsages: [],
  packageSales: [],
  recentTransactions: [],
  recentSystemLogs: [],
  recentBugReports: [],
  userTrends: [],
  revenueTrends: [],
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('AdminDashboardPage - Page Guard & Permission Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Giả lập isInitializing = true ➔ kỳ vọng render component AdminDashboardSkeleton', () => {
    mockAuthState.isInitializing = true
    mockAuthState.user = null
    mockAuthState.isAuthenticated = false

    renderWithClient(<AdminDashboardPage />)

    // Kỳ vọng hiển thị Skeleton loading
    expect(screen.getByTestId('admin-dashboard-skeleton')).toBeDefined()
    // Không render nội dung dashboard hay lỗi phân quyền
    expect(screen.queryByText('Không có quyền truy cập')).toBeNull()
    expect(screen.queryByText('Trung Tâm Tổng Quan MathClass')).toBeNull()
    // Không gọi API backend
    expect(adminDashboardService.getStats).not.toHaveBeenCalled()
  })

  it('Giả lập user.permissions = [] (không có dashboard:admin_view) ➔ kỳ vọng render màn hình "Không có quyền truy cập", không render các thẻ thống kê', () => {
    mockAuthState.isInitializing = false
    mockAuthState.user = {
      id: 99,
      email: 'staff@mathclass.edu.vn',
      fullName: 'Quản trị viên phụ trách',
      role: 'ADMIN',
      permissions: [], // Không có dashboard:admin_view
    }
    mockAuthState.isAuthenticated = true

    renderWithClient(<AdminDashboardPage />)

    // 1. Kỳ vọng hiển thị màn hình cảnh báo không có quyền
    expect(screen.getByText('Không có quyền truy cập')).toBeDefined()
    expect(screen.getByText(/dashboard:admin_view/)).toBeDefined()
    expect(screen.getByText(/Vui lòng liên hệ quản trị viên cấp cao/)).toBeDefined()

    // 2. Kỳ vọng KHÔNG render các thẻ thống kê và dashboard chính
    expect(screen.queryByText('Trung Tâm Tổng Quan MathClass')).toBeNull()
    expect(screen.queryByTestId('admin-dashboard-skeleton')).toBeNull()

    // 3. API backend không được phép gọi
    expect(adminDashboardService.getStats).not.toHaveBeenCalled()
  })

  it('Giả lập người dùng có quyền dashboard:admin_view ➔ kỳ vọng render dữ liệu thống kê đầy đủ', async () => {
    mockAuthState.isInitializing = false
    mockAuthState.user = {
      id: 1,
      email: 'superadmin@mathclass.edu.vn',
      fullName: 'Super Admin',
      role: 'ADMIN',
      permissions: ['dashboard:admin_view'],
    }
    mockAuthState.isAuthenticated = true
    vi.mocked(adminDashboardService.getStats).mockResolvedValueOnce(mockStats)

    renderWithClient(<AdminDashboardPage />)

    // Kỳ vọng nạp và hiển thị màn hình chính
    await waitFor(() => {
      expect(screen.getByText('Trung Tâm Tổng Quan MathClass')).toBeDefined()
    })

    // API getStats được gọi đúng với tháng/năm hiện tại
    expect(adminDashboardService.getStats).toHaveBeenCalledTimes(1)
  })
})
