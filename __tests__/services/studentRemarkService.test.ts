import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { studentRemarkService, CreateStudentRemarkPayload, StudentRemark } from '@/services/studentRemarkService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('studentRemarkService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRemarks', () => {
    it('gọi đúng URL và trả về mảng danh sách nhận xét khi API trả về array', async () => {
      const mockRemarks: StudentRemark[] = [
        {
          id: 1,
          studentId: 10,
          studentName: 'Lê Thị Bình',
          teacherId: 2,
          teacherName: 'Thầy Nguyễn Văn A',
          strengths: 'Tư duy logic tốt',
          weaknesses: 'Tính toán còn ẩu',
          generalAssessment: 'Khá',
          createdAt: '2026-08-27T10:00:00Z',
          updatedAt: '2026-08-27T10:00:00Z',
        },
      ]
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockRemarks })

      const result = await studentRemarkService.getRemarks('MATH101', 10)

      expect(api.get).toHaveBeenCalledWith('/classrooms/MATH101/students/10/remarks')
      expect(result).toEqual(mockRemarks)
    })

    it('trả về mảng rỗng [] nếu dữ liệu trả về không phải array', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: null })

      const result = await studentRemarkService.getRemarks('MATH101', 10)

      expect(api.get).toHaveBeenCalledWith('/classrooms/MATH101/students/10/remarks')
      expect(result).toEqual([])
    })
  })

  describe('createRemark', () => {
    it('gọi đúng URL và gửi payload tạo nhận xét mới', async () => {
      const payload: CreateStudentRemarkPayload = {
        strengths: 'Chăm chỉ phát biểu',
        weaknesses: 'Trình bày còn vắn tắt',
        generalAssessment: 'Cần cẩn thận hơn',
      }
      const mockCreated: StudentRemark = {
        id: 5,
        studentId: 10,
        studentName: 'Lê Thị Bình',
        teacherId: 2,
        teacherName: 'Thầy Nguyễn Văn A',
        strengths: payload.strengths,
        weaknesses: payload.weaknesses,
        generalAssessment: payload.generalAssessment,
        createdAt: '2026-08-27T11:00:00Z',
        updatedAt: '2026-08-27T11:00:00Z',
      }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockCreated })

      const result = await studentRemarkService.createRemark('MATH101', 10, payload)

      expect(api.post).toHaveBeenCalledWith('/classrooms/MATH101/students/10/remarks', payload)
      expect(result).toEqual(mockCreated)
    })
  })

  describe('deleteRemark', () => {
    it('gọi đúng URL xóa nhận xét theo remarkId', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: null })

      await studentRemarkService.deleteRemark('MATH101', 10, 5)

      expect(api.delete).toHaveBeenCalledWith('/classrooms/MATH101/students/10/remarks/5')
    })
  })

  describe('evaluateWithAi', () => {
    it('gọi đúng endpoint POST /remarks/ai-evaluate với payload mốc thời gian', async () => {
      const mockResult = {
        startDate: '2026-08-21',
        endDate: '2026-08-28',
        totalAssignments: 5,
        completedAssignments: 4,
        overdueAssignments: 0,
        activeIncompleteAssignments: 1,
        averageScore: 8.5,
        strengths: 'Tư duy logic tốt',
        weaknesses: 'Tính còn ẩu',
        generalAssessment: 'Đạt yêu cầu',
      }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResult })

      const result = await studentRemarkService.evaluateWithAi('MATH101', 10, { days: 7 })

      expect(api.post).toHaveBeenCalledWith(
        '/classrooms/MATH101/students/10/remarks/ai-evaluate',
        { days: 7 }
      )
      expect(result).toEqual(mockResult)
    })
  })
})
