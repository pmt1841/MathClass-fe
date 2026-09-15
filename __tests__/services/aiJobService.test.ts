import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axiosInstance from '@/lib/axios'
import { aiJobService, AI_JOB_EVENT_NAME } from '@/services/aiJobService'
import { AiJobResultResponse } from '@/types/aiJob'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('aiJobService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getJobStatus', () => {
    it('gọi đúng GET /ai/jobs/{jobId}', async () => {
      const mockJob: AiJobResultResponse = {
        jobId: 'test-job-123',
        taskCode: 'QUESTION_GEN',
        status: 'PROCESSING',
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }

      vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockJob } as any)

      const result = await aiJobService.getJobStatus('test-job-123')
      expect(axiosInstance.get).toHaveBeenCalledWith('/ai/jobs/test-job-123')
      expect(result).toEqual(mockJob)
    })
  })

  describe('waitForAiJob', () => {
    it('nhận kết quả ngay khi có sự kiện SSE (CustomEvent)', async () => {
      const promise = aiJobService.waitForAiJob<string>('job-sse-1')

      // Giả lập nhận SSE event
      window.dispatchEvent(
        new CustomEvent(AI_JOB_EVENT_NAME, {
          detail: {
            eventType: 'AI_JOB_COMPLETED',
            jobId: 'job-sse-1',
            taskCode: 'QUESTION_GEN',
            status: 'COMPLETED',
            result: 'Kết quả đề toán AI',
          },
        })
      )

      const result = await promise
      expect(result).toBe('Kết quả đề toán AI')
    })

    it('báo lỗi khi nhận SSE event FAILED', async () => {
      const promise = aiJobService.waitForAiJob<string>('job-sse-fail')

      window.dispatchEvent(
        new CustomEvent(AI_JOB_EVENT_NAME, {
          detail: {
            eventType: 'AI_JOB_FAILED',
            jobId: 'job-sse-fail',
            taskCode: 'QUESTION_GEN',
            status: 'FAILED',
            errorMessage: 'Hết quota Gemini',
          },
        })
      )

      await expect(promise).rejects.toThrow('Hết quota Gemini')
    })

    it('fallback polling thành công nếu không có SSE', async () => {
      const mockPending: AiJobResultResponse = {
        jobId: 'job-poll-1',
        taskCode: 'QUESTION_GEN',
        status: 'PROCESSING',
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }

      const mockDone: AiJobResultResponse = {
        jobId: 'job-poll-1',
        taskCode: 'QUESTION_GEN',
        status: 'COMPLETED',
        result: 'Đã hoàn tất qua polling',
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }

      vi.mocked(axiosInstance.get)
        .mockResolvedValueOnce({ data: mockPending } as any)
        .mockResolvedValueOnce({ data: mockDone } as any)

      const statusChanges: string[] = []
      const promise = aiJobService.waitForAiJob<string>('job-poll-1', {
        pollIntervalMs: 1000,
        onStatusChange: (status) => statusChanges.push(status),
      })

      // Advance timer for first poll
      await vi.advanceTimersByTimeAsync(1000)
      expect(statusChanges).toContain('PROCESSING')

      // Advance timer for second poll
      await vi.advanceTimersByTimeAsync(1000)
      const result = await promise

      expect(result).toBe('Đã hoàn tất qua polling')
      expect(statusChanges).toContain('COMPLETED')
    })

    it('bị reject khi người dùng hủy bỏ (AbortSignal)', async () => {
      const controller = new AbortController()
      const promise = aiJobService.waitForAiJob('job-abort', {
        signal: controller.signal,
      })

      controller.abort()

      await expect(promise).rejects.toThrow('Tác vụ AI đã bị người dùng hủy bỏ')
    })
  })

  describe('cancelJob', () => {
    it('gọi đúng POST /ai/jobs/{jobId}/cancel và trả về kết quả hủy khi force = false', async () => {
      const mockCancelRes = {
        jobId: 'job-cancel-999',
        status: 'CANCELLED',
        cancelled: true,
        refunded: true,
        refundedCredits: 4,
        code: 'SUCCESS',
        message: 'Đã hủy tác vụ trong hàng chờ và hoàn lại 4 credit.',
      }

      vi.mocked(axiosInstance.post).mockResolvedValue({ data: mockCancelRes } as any)

      const result = await aiJobService.cancelJob('job-cancel-999')
      expect(axiosInstance.post).toHaveBeenCalledWith('/ai/jobs/job-cancel-999/cancel', null, {
        params: undefined,
      })
      expect(result).toEqual(mockCancelRes)
    })

    it('gọi POST /ai/jobs/{jobId}/cancel với params force = true khi người dùng chấp nhận mất credit', async () => {
      const mockCancelRes = {
        jobId: 'job-cancel-force',
        status: 'CANCELLED',
        cancelled: true,
        refunded: false,
        refundedCredits: 0,
        code: 'CANCELLED_WITHOUT_REFUND',
        message: 'Đã hủy tác vụ đang xử lý (không hoàn credit).',
      }

      vi.mocked(axiosInstance.post).mockResolvedValue({ data: mockCancelRes } as any)

      const result = await aiJobService.cancelJob('job-cancel-force', true)
      expect(axiosInstance.post).toHaveBeenCalledWith('/ai/jobs/job-cancel-force/cancel', null, {
        params: { force: true },
      })
      expect(result).toEqual(mockCancelRes)
    })
  })
})
