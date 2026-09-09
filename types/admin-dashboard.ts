export interface UserStats {
  totalUsers: number
  teacherCount: number
  studentCount: number
  newUsersThisWeek: number
  activeUsersToday: number
}

export interface ClassroomStats {
  activeClassesCount: number
}

export interface RevenueStats {
  monthlyRevenue: number
  growthPercentage: number
  successfulOrdersCount: number
}

export interface BugReportStats {
  pendingCount: number
}

export interface AiTaskUsage {
  taskCode: string
  taskName: string
  callCount: number
  successCount: number
  failedCount: number
  successRate: number
  percentage: number
}

export interface PackageSales {
  packageId: number
  packageName: string
  credits: number
  price: number
  salesCount: number
}

export interface RecentTransaction {
  orderId: number
  userId: number
  fullName: string
  avatarUrl: string | null
  role: 'TEACHER' | 'STUDENT' | 'ADMIN' | string
  packageName: string
  price: number
  credits: number
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | string
  paidAt: string
}

export interface MonthlyUserTrend {
  month: number
  count: number
}

export interface MonthlyRevenueTrend {
  month: number
  revenue: number
}

export interface RecentSystemLog {
  id: number
  actor: string
  resourceType?: string
  action: string
  level?: string
  createdAt: string
}

export interface RecentBugReport {
  id: number
  reporterEmail: string
  errorType: string
  description?: string
  status?: string
  createdAt: string
}

export interface AdminDashboardStats {
  selectedMonth?: number
  selectedYear?: number
  userStats: UserStats
  classroomStats: ClassroomStats
  revenueStats: RevenueStats
  bugReportStats: BugReportStats
  aiTaskUsages: AiTaskUsage[]
  packageSales: PackageSales[]
  recentTransactions: RecentTransaction[]
  userTrends?: MonthlyUserTrend[]
  revenueTrends?: MonthlyRevenueTrend[]
  recentSystemLogs?: RecentSystemLog[]
  recentBugReports?: RecentBugReport[]
}
