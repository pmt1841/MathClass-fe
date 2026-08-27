import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { submissionService } from '@/services/submissionService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  }
}))

describe('submissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getComments', () => {
    it('gọi đúng URL khi không truyền versionNumber', async () => {
      const mockComments = [
        { id: 1, submissionId: 100, versionNumber: 1, teacherId: 2, teacherName: 'Thầy A', quoteText: 'câu 1', commentText: 'Tốt', createdAt: '2026-08-26' }
      ]
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockComments })

      const result = await submissionService.getComments(100)

      expect(api.get).toHaveBeenCalledWith('/submissions/100/comments')
      expect(result).toEqual(mockComments)
    })

    it('gọi đúng URL có query param khi truyền versionNumber', async () => {
      const mockComments = [
        { id: 2, submissionId: 100, versionNumber: 2, teacherId: 2, teacherName: 'Thầy A', quoteText: 'câu 2 sửa', commentText: 'Chính xác', createdAt: '2026-08-26' }
      ]
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockComments })

      const result = await submissionService.getComments(100, 2)

      expect(api.get).toHaveBeenCalledWith('/submissions/100/comments?versionNumber=2')
      expect(result).toEqual(mockComments)
    })
  })

  describe('addComment', () => {
    it('gửi payload đầy đủ bao gồm versionNumber', async () => {
      const payload = {
        versionNumber: 2,
        quoteText: 'Phần kết luận',
        content: 'Cần giải thích rõ hơn'
      }
      const mockCreated = {
        id: 3,
        submissionId: 100,
        versionNumber: 2,
        teacherId: 2,
        teacherName: 'Thầy A',
        quoteText: 'Phần kết luận',
        content: 'Cần giải thích rõ hơn',
        createdAt: '2026-08-26'
      }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockCreated })

      const result = await submissionService.addComment(100, payload)

      expect(api.post).toHaveBeenCalledWith('/submissions/100/comments', payload)
      expect(result).toEqual(mockCreated)
    })
  })

  describe('deleteComment', () => {
    it('gọi DELETE đúng URL', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: null })

      await submissionService.deleteComment(100, 5)

      expect(api.delete).toHaveBeenCalledWith('/submissions/100/comments/5')
    })
  })

  describe('getSubmissionVersions', () => {
    it('lấy danh sách lịch sử versions bài nộp', async () => {
      const mockVersions = [
        { id: 1, submissionId: 100, versionNumber: 1, content: 'Bài làm 1', submittedAt: '2026-08-26' },
        { id: 2, submissionId: 100, versionNumber: 2, content: 'Bài làm 2', submittedAt: '2026-08-26' }
      ]
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockVersions })

      const result = await submissionService.getSubmissionVersions(100)

      expect(api.get).toHaveBeenCalledWith('/submissions/100/versions')
      expect(result).toEqual(mockVersions)
    })
  })
})
