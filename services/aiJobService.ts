import axiosInstance from '@/lib/axios'
import { AiJobResultResponse, AiJobStatus, AiJobEventPayload, AiJobCancelResponse } from '@/types/aiJob'

export interface WaitForAiJobOptions {
  onStatusChange?: (status: AiJobStatus, message?: string, job?: AiJobResultResponse) => void
  pollIntervalMs?: number
  timeoutMs?: number
  signal?: AbortSignal
}

export const AI_JOB_EVENT_NAME = 'mathclass-ai-job'

export const aiJobService = {
  /**
   * Tra cứu trạng thái và kết quả của tác vụ AI từ Redis.
   */
  async getJobStatus<T = unknown>(jobId: string): Promise<AiJobResultResponse<T>> {
    const res = await axiosInstance.get<AiJobResultResponse<T>>(`/ai/jobs/${jobId}`)
    return res.data
  },

  /**
   * Hủy tác vụ AI đang trong hàng đợi hoặc đang xử lý.
   * @param jobId Mã tác vụ AI
   * @param force Nếu true, hủy ngay cả khi AI đã bước vào PROCESSING (chấp nhận mất credit)
   */
  async cancelJob(jobId: string, force = false): Promise<AiJobCancelResponse> {
    const res = await axiosInstance.post<AiJobCancelResponse>(`/ai/jobs/${jobId}/cancel`, null, {
      params: force ? { force: true } : undefined,
    })
    return res.data
  },

  /**
   * Chờ hoàn tất tác vụ AI với cơ chế kép (Dual Delivery):
   * 1. Lắng nghe sự kiện SSE realtime qua Global CustomEvent 'mathclass-ai-job'.
   * 2. Polling định kỳ qua API /ai/jobs/{jobId} làm Fallback nếu SSE bị trễ hoặc ngắt kết nối.
   */
  waitForAiJob<T = unknown>(
    jobId: string,
    options: WaitForAiJobOptions = {}
  ): Promise<T> {
    const {
      onStatusChange,
      pollIntervalMs = 2000,
      timeoutMs = 120000,
      signal
    } = options

    return new Promise<T>((resolve, reject) => {
      let isSettled = false
      let initialPollTimer: NodeJS.Timeout | null = null
      let pollTimer: NodeJS.Timeout | null = null
      let timeoutTimer: NodeJS.Timeout | null = null

      const cleanup = () => {
        isSettled = true
        if (initialPollTimer) clearTimeout(initialPollTimer)
        if (pollTimer) clearInterval(pollTimer)
        if (timeoutTimer) clearTimeout(timeoutTimer)
        if (typeof window !== 'undefined') {
          window.removeEventListener(AI_JOB_EVENT_NAME, handleCustomEvent as EventListener)
        }
        if (signal) {
          signal.removeEventListener('abort', handleAbort)
        }
      }

      const handleAbort = () => {
        if (isSettled) return
        cleanup()
        reject(new Error('Tác vụ AI đã bị người dùng hủy bỏ'))
      }

      if (signal?.aborted) {
        handleAbort()
        return
      }
      if (signal) {
        signal.addEventListener('abort', handleAbort)
      }

      // 1. SSE Realtime Event Listener
      const handleCustomEvent = (event: CustomEvent<AiJobEventPayload<T>>) => {
        if (isSettled) return
        const payload = event.detail
        if (!payload || payload.jobId !== jobId) return

        if (payload.status) {
          onStatusChange?.(payload.status, payload.errorMessage)
        }

        if (payload.eventType === 'AI_JOB_COMPLETED' || payload.status === 'COMPLETED') {
          cleanup()
          resolve(payload.result as T)
        } else if (payload.eventType === 'AI_JOB_FAILED' || payload.status === 'FAILED') {
          cleanup()
          reject(new Error(payload.errorMessage || 'Xử lý tác vụ AI thất bại'))
        }
      }

      if (typeof window !== 'undefined') {
        window.addEventListener(AI_JOB_EVENT_NAME, handleCustomEvent as EventListener)
      }

      // 2. Polling Fallback Loop
      const doPoll = async () => {
        if (isSettled) return
        try {
          const job = await aiJobService.getJobStatus<T>(jobId)
          if (isSettled) return

          onStatusChange?.(job.status, job.errorMessage, job as AiJobResultResponse)

          if (job.status === 'COMPLETED') {
            cleanup()
            resolve(job.result as T)
          } else if (job.status === 'FAILED') {
            cleanup()
            reject(new Error(job.errorMessage || 'Tác vụ AI thất bại'))
          }
        } catch (err: unknown) {
          // Bỏ qua lỗi polling tạm thời trừ khi đã abort
          if (isSettled) return
          const axiosError = err as { response?: { status: number } }
          if (axiosError?.response?.status === 404) {
            cleanup()
            reject(new Error('Không tìm thấy thông tin tác vụ AI hoặc tác vụ đã hết hạn'))
          }
        }
      }

      // Khởi động timeout tổng
      timeoutTimer = setTimeout(() => {
        if (isSettled) return
        cleanup()
        reject(new Error('Quá thời gian chờ xử lý tác vụ AI (Timeout sau 2 phút)'))
      }, timeoutMs)

      // Chạy poll ban đầu ngay sau 250ms để bắt kịp PROCESSING tức thì, rồi lặp lại mỗi pollIntervalMs
      initialPollTimer = setTimeout(doPoll, 250)
      pollTimer = setInterval(doPoll, pollIntervalMs)
    })
  }
}
