import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { adminDashboardService } from '@/services/adminDashboardService'
import { AdminDashboardStats } from '@/types/admin-dashboard'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('adminDashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockStats = (overrides?: Partial<AdminDashboardStats>): AdminDashboardStats => ({
    userStats: {
      totalUsers: 150,
      teacherCount: 20,
      studentCount: 130,
      newUsersInMonth: 15,
      activeUsersToday: 45,
    },
    classroomStats: {
      activeClassesCount: 12,
    },
    revenueStats: {
      monthlyRevenue: 15000000,
      growthPercentage: 12.5,
      successfulOrdersCount: 85,
    },
    bugReportStats: {
      pendingCount: 3,
    },
    aiTaskUsages: [],
    packageSales: [],
    recentTransactions: [],
    ...overrides,
  })

  it('getStats - gọi GET /admin/dashboard/stats không có query param khi không truyền month và year', async () => {
    const mockStats = createMockStats()

    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        code: 200,
        message: 'Success',
        result: mockStats,
      },
    })

    const result = await adminDashboardService.getStats()

    expect(api.get).toHaveBeenCalledWith('/admin/dashboard/stats')
    expect(result).toEqual(mockStats)
    expect(result.userStats.totalUsers).toBe(150)
  })

  it('getStats - gọi GET kèm query parameters khi truyền month và year', async () => {
    const mockStats = createMockStats({
      selectedMonth: 9,
      selectedYear: 2026,
      revenueStats: {
        monthlyRevenue: 18000000,
        growthPercentage: 20.0,
        successfulOrdersCount: 95,
      },
    })

    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        code: 200,
        message: 'Success',
        result: mockStats,
      },
    })

    const result = await adminDashboardService.getStats(9, 2026)

    expect(api.get).toHaveBeenCalledWith('/admin/dashboard/stats?month=9&year=2026')
    expect(result).toEqual(mockStats)
    expect(result.revenueStats.monthlyRevenue).toBe(18000000)
  })

  it('getStats - gọi GET chỉ có month hoặc chỉ có year', async () => {
    const mockStats = createMockStats({ selectedYear: 2026 })

    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        code: 200,
        message: 'Success',
        result: mockStats,
      },
    })

    await adminDashboardService.getStats(undefined, 2026)
    expect(api.get).toHaveBeenCalledWith('/admin/dashboard/stats?year=2026')
  })
})
