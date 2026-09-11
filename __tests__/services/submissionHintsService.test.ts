import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import {
  submissionHintsService,
  submissionHintApi,
  StudentHintResponse,
  HintHistoryResponse,
} from '@/services/submissionHintsService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('submissionHintsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('đảm bảo alias submissionHintApi trỏ tới cùng submissionHintsService instance', () => {
    expect(submissionHintApi).toBe(submissionHintsService)
  })

  describe('requestHint', () => {
    it('gọi POST /submissions/assignments/:assignmentId/hints với currentContent', async () => {
      const mockResponse: StudentHintResponse = {
        id: 1,
        submissionId: 100,
        hintNumber: 1,
        maxHints: 3,
        remainingHints: 2,
        hintContent: 'Hãy thử áp dụng định lý Pytago cho tam giác vuông ABC.',
        createdAt: '2026-09-11T10:00:00Z',
      }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse })

      const result = await submissionHintsService.requestHint(50, 'Em đang vẽ tam giác vuông')

      expect(api.post).toHaveBeenCalledWith('/submissions/assignments/50/hints', {
        currentContent: 'Em đang vẽ tam giác vuông',
      })
      expect(result).toEqual(mockResponse)
      expect(result.remainingHints).toBe(2)
      expect(result.hintContent).toContain('Pytago')
    })
  })

  describe('getHintHistory', () => {
    it('gọi GET /submissions/:submissionId/hints và trả về toàn bộ lịch sử gợi ý', async () => {
      const mockHistory: HintHistoryResponse = {
        submissionId: 100,
        totalUsed: 2,
        maxHints: 3,
        remainingHints: 1,
        hints: [
          {
            id: 1,
            hintNumber: 1,
            studentSnapshotContent: 'Chưa biết làm',
            aiHintContent: 'Xem lại định nghĩa hàm số bậc 1',
            createdAt: '2026-09-11T10:00:00Z',
          },
          {
            id: 2,
            hintNumber: 2,
            studentSnapshotContent: 'y = ax + b',
            aiHintContent: 'Thay tọa độ điểm A(1, 2) vào phương trình',
            createdAt: '2026-09-11T10:05:00Z',
          },
        ],
      }
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockHistory })

      const result = await submissionHintsService.getHintHistory(100)

      expect(api.get).toHaveBeenCalledWith('/submissions/100/hints')
      expect(result).toEqual(mockHistory)
      expect(result.hints).toHaveLength(2)
      expect(result.remainingHints).toBe(1)
    })
  })
})
