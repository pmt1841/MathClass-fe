import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { aiJobService } from '@/services/aiJobService'
import {
  submissionAiGradingService,
  AiGradingResult,
} from '@/services/submissionAiGradingService'

vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock('@/services/aiJobService', () => ({
  aiJobService: {
    waitForAiJob: vi.fn(),
  },
}))

describe('submissionAiGradingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitAiGrading (đồng bộ)', () => {
    it('gọi POST /submissions/:id/ai-grading và trả về AiGradingResult', async () => {
      const mockResult: AiGradingResult = {
        suggestedScore: 8.5,
        draftFeedback: 'Học sinh làm đúng bước giải phương trình, phần vẽ hình cần vẽ thêm đường cao.',
        drawingIssues: [
          {
            issue: 'Thiếu đường cao AH',
            detail: 'Hình vẽ chưa thể hiện đường cao hạ từ đỉnh A vuông góc với BC',
          },
        ],
        hasCanvasComparison: true,
      }

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResult })

      const controller = new AbortController()
      const result = await submissionAiGradingService.submitAiGrading(101, 202, {
        signal: controller.signal,
      })

      expect(api.post).toHaveBeenCalledWith(
        '/submissions/101/ai-grading',
        { assignmentId: 202 },
        { signal: controller.signal }
      )
      expect(result).toEqual(mockResult)
      expect(result.suggestedScore).toBe(8.5)
      expect(result.drawingIssues).toHaveLength(1)
    })
  })

  describe('submitAiGradingAsync (bất đồng bộ)', () => {
    it('gọi POST /submissions/:id/ai-grading?async=true và đợi kết quả qua aiJobService', async () => {
      const mockJobResponse = {
        jobId: 'job-grading-555',
        status: 'PENDING',
      }

      const mockFinalResult: AiGradingResult = {
        suggestedScore: 9.0,
        draftFeedback: 'Lời giải chính xác và chặt chẽ.',
        drawingIssues: [],
        hasCanvasComparison: false,
      }

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockJobResponse })
      vi.mocked(aiJobService.waitForAiJob).mockResolvedValueOnce(mockFinalResult as any)

      const onStatusChange = vi.fn()
      const controller = new AbortController()

      const result = await submissionAiGradingService.submitAiGradingAsync(101, 202, {
        onStatusChange,
        signal: controller.signal,
      })

      expect(api.post).toHaveBeenCalledWith(
        '/submissions/101/ai-grading?async=true',
        { assignmentId: 202 },
        { signal: controller.signal }
      )
      expect(aiJobService.waitForAiJob).toHaveBeenCalledWith('job-grading-555', {
        onStatusChange,
        signal: controller.signal,
      })
      expect(result).toEqual(mockFinalResult)
      expect(result.suggestedScore).toBe(9.0)
    })
  })
})
