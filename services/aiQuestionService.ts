import axiosInstance from '@/lib/axios'
import { aiJobService } from '@/services/aiJobService'
import { AiJobResultResponse, AiJobStatus, AiJobSubmitResponse } from '@/types/aiJob'

export interface GenerateQuestionRequestDTO {
  prompt: string
  grade?: number
  difficulty?: 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG' | 'VAN_DUNG_CAO' | string
  topic?: string
  questionType?: 'ESSAY' | 'MULTIPLE_CHOICE' | string
  includeCanvasDiagram?: boolean
  includeExplanation?: boolean
}

export interface CanvasElementDTO {
  type: string
  id: string
  x?: number
  y?: number
  label?: string
  labelPosition?: string
  centerId?: string
  radius?: number
  fromId?: string
  toId?: string
  style?: string
  parsedFunc?: string
  func?: string
}

export interface CanvasDataDTO {
  width?: number
  height?: number
  elements?: CanvasElementDTO[]
}

export interface AiGeneratedQuestionDTO {
  title?: string
  content: string
  explanation?: string
  grade?: number
  difficulty?: string
  topic?: string
  model?: string
  canvasData?: CanvasDataDTO
}

export interface ApiResponse<T> {
  code: number
  message: string
  result: T
}

export const aiQuestionService = {
  /**
   * Gọi API Backend /api/v1/ai/generate-question để sinh câu hỏi bằng AI (đồng bộ)
   */
  async generateQuestion(dto: GenerateQuestionRequestDTO): Promise<AiGeneratedQuestionDTO> {
    const response = await axiosInstance.post<AiGeneratedQuestionDTO>('/ai/generate-question', dto)
    return response.data
  },

  /**
   * Gọi API Backend sinh câu hỏi bằng AI bất đồng bộ qua Redis Queue
   * Phản hồi 202 Accepted ngay lập tức và theo dõi tiến trình qua SSE / Polling Fallback.
   */
  async generateQuestionAsync(
    dto: GenerateQuestionRequestDTO,
    options?: {
      onJobCreated?: (jobId: string) => void | Promise<void>
      onStatusChange?: (status: AiJobStatus, message?: string, job?: AiJobResultResponse) => void
      signal?: AbortSignal
    }
  ): Promise<AiGeneratedQuestionDTO> {
    const response = await axiosInstance.post<AiJobSubmitResponse>(
      '/ai/generate-question?async=true',
      dto,
      { signal: options?.signal }
    )
    const jobId = response.data.jobId
    if (options?.onJobCreated) {
      await options.onJobCreated(jobId)
    }

    return aiJobService.waitForAiJob<AiGeneratedQuestionDTO>(jobId, {
      onStatusChange: options?.onStatusChange,
      signal: options?.signal
    })
  }
}

