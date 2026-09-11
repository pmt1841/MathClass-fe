import { describe, it, expect, vi, beforeEach } from 'vitest'
import axiosInstance from '@/lib/axios'
import { aiJobService } from '@/services/aiJobService'
import {
  aiQuestionService,
  GenerateQuestionRequestDTO,
  AiGeneratedQuestionDTO,
} from '@/services/aiQuestionService'

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

describe('aiQuestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateQuestion (đồng bộ)', () => {
    it('gọi POST /ai/generate-question và trả về kết quả AiGeneratedQuestionDTO', async () => {
      const requestDto: GenerateQuestionRequestDTO = {
        prompt: 'Tạo câu hỏi về giải phương trình bậc 2',
        grade: 9,
        difficulty: 'THONG_HIEU',
        topic: 'Đại số',
        questionType: 'ESSAY',
        includeExplanation: true,
      }

      const mockQuestion: AiGeneratedQuestionDTO = {
        title: 'Giải phương trình bậc 2',
        content: 'Giải phương trình $x^2 - 5x + 6 = 0$',
        explanation: 'Phương trình có hai nghiệm x = 2 hoặc x = 3',
        grade: 9,
        difficulty: 'THONG_HIEU',
        topic: 'Đại số',
        model: 'gemini-2.0-flash',
      }

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockQuestion })

      const result = await aiQuestionService.generateQuestion(requestDto)

      expect(axiosInstance.post).toHaveBeenCalledWith('/ai/generate-question', requestDto)
      expect(result).toEqual(mockQuestion)
      expect(result.content).toContain('x^2 - 5x + 6 = 0')
    })
  })

  describe('generateQuestionAsync (bất đồng bộ)', () => {
    it('gọi POST /ai/generate-question?async=true và ủy thác cho aiJobService.waitForAiJob', async () => {
      const requestDto: GenerateQuestionRequestDTO = {
        prompt: 'Tạo bài toán hình học có sơ đồ canvas',
        grade: 8,
        includeCanvasDiagram: true,
      }

      const mockJobSubmitResponse = {
        jobId: 'job-gen-q-999',
        status: 'PENDING',
        message: 'Job submitted successfully',
      }

      const mockFinalQuestion: AiGeneratedQuestionDTO = {
        title: 'Tam giác vuông',
        content: 'Cho tam giác ABC vuông tại A',
        canvasData: {
          width: 500,
          height: 400,
          elements: [
            { type: 'point', id: 'A', x: 100, y: 100, label: 'A' },
            { type: 'point', id: 'B', x: 100, y: 300, label: 'B' },
            { type: 'point', id: 'C', x: 400, y: 300, label: 'C' },
          ],
        },
      }

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockJobSubmitResponse })
      vi.mocked(aiJobService.waitForAiJob).mockResolvedValueOnce(mockFinalQuestion as any)

      const onStatusChange = vi.fn()
      const controller = new AbortController()

      const result = await aiQuestionService.generateQuestionAsync(requestDto, {
        onStatusChange,
        signal: controller.signal,
      })

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/ai/generate-question?async=true',
        requestDto,
        { signal: controller.signal }
      )
      expect(aiJobService.waitForAiJob).toHaveBeenCalledWith('job-gen-q-999', {
        onStatusChange,
        signal: controller.signal,
      })
      expect(result).toEqual(mockFinalQuestion)
      expect(result.canvasData?.elements).toHaveLength(3)
    })
  })
})
