import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import {
  dashboardService,
  TeacherDashboardStats,
  PendingSubmission,
  AtRiskStudent,
} from '@/services/dashboardService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getTeacherStats - gọi GET /dashboard/teacher-stats và trả về thống kê của giáo viên', async () => {
    const mockStats: TeacherDashboardStats = {
      teachingClasses: 3,
      managedStudents: 105,
      assignmentsToGrade: 12,
      pendingJoinRequests: 4,
      openAssignments: 5,
      originalAssignmentSheets: 8,
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockStats })

    const result = await dashboardService.getTeacherStats()

    expect(api.get).toHaveBeenCalledWith('/dashboard/teacher-stats')
    expect(result).toEqual(mockStats)
    expect(result.teachingClasses).toBe(3)
  })

  it('getPendingSubmissions - gọi GET /dashboard/pending-submissions với limit mặc định và tùy chỉnh', async () => {
    const mockSubmissions: PendingSubmission[] = [
      {
        id: 1,
        assignmentId: 10,
        studentName: 'Lê Văn A',
        assignmentTitle: 'Giải toán hàm số',
        className: '10A1',
        classCode: 'MATH10A1',
        submittedAt: '2026-09-11T09:00:00Z',
      },
    ]
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockSubmissions })

    const resultDefault = await dashboardService.getPendingSubmissions()
    expect(api.get).toHaveBeenCalledWith('/dashboard/pending-submissions?limit=10')
    expect(resultDefault).toEqual(mockSubmissions)

    vi.mocked(api.get).mockResolvedValueOnce({ data: [] })
    await dashboardService.getPendingSubmissions(5)
    expect(api.get).toHaveBeenCalledWith('/dashboard/pending-submissions?limit=5')
  })

  it('getStudentStats - gọi GET /dashboard/student-stats và trả về thống kê học tập của học sinh', async () => {
    const mockStudentStats = {
      enrolledClasses: 2,
      pendingTasks: 3,
      gradedTasks: 15,
      averageScore: 8.8,
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockStudentStats })

    const result = await dashboardService.getStudentStats()

    expect(api.get).toHaveBeenCalledWith('/dashboard/student-stats')
    expect(result).toEqual(mockStudentStats)
  })

  it('getStudentPendingTasks - gọi GET /dashboard/student-pending-tasks với limit', async () => {
    const mockPending = [{ id: 101, title: 'Bài tập Đại số' }]
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockPending })

    const result = await dashboardService.getStudentPendingTasks(8)

    expect(api.get).toHaveBeenCalledWith('/dashboard/student-pending-tasks?limit=8')
    expect(result).toEqual(mockPending)
  })

  it('getStudentGradedTasks - gọi GET /dashboard/student-graded-tasks với limit', async () => {
    const mockGraded = [{ id: 102, title: 'Bài kiểm tra 15 phút', score: 9.5 }]
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockGraded })

    const result = await dashboardService.getStudentGradedTasks(6)

    expect(api.get).toHaveBeenCalledWith('/dashboard/student-graded-tasks?limit=6')
    expect(result).toEqual(mockGraded)
  })

  it('getAtRiskStudents - gọi GET /dashboard/at-risk-students trả về danh sách học sinh cần hỗ trợ', async () => {
    const mockAtRisk: AtRiskStudent[] = [
      {
        id: 20,
        name: 'Trần Văn C',
        className: '10A1',
        issueType: 'MISSING_ASSIGNMENTS',
        detail: 'Chưa nộp 3 bài liên tiếp',
        avatar: 'https://example.com/avatar.jpg',
      },
    ]
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockAtRisk })

    const result = await dashboardService.getAtRiskStudents()

    expect(api.get).toHaveBeenCalledWith('/dashboard/at-risk-students')
    expect(result).toEqual(mockAtRisk)
    expect(result[0].issueType).toBe('MISSING_ASSIGNMENTS')
  })
})
