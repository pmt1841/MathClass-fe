import axiosInstance from '@/lib/axios'
import { aiJobService } from '@/services/aiJobService'
import { AiJobStatus, AiJobSubmitResponse } from '@/types/aiJob'

export interface BatchQuestionItemDTO {
  id?: string
  title?: string
  description?: string
  content: string
  explanation?: string
  difficulty?: 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG' | 'VAN_DUNG_CAO' | string
  suggestedScore?: number
}

export interface AssignmentImageItemDTO {
  imageCode: string
  imageUrl: string
}

export interface BatchGenerateQuestionsResponseDTO {
  suggestedTitle?: string
  suggestedDescription?: string
  questions: BatchQuestionItemDTO[]
  totalQuestions: number
  extractedImages?: AssignmentImageItemDTO[]
  model?: string
}

export interface BatchGenerateQuestionsParams {
  file?: File
  textContent?: string
  grade?: number
  topic?: string
  questionType?: string
  includeExplanation?: boolean
  includeCanvasDiagram?: boolean
}

function buildFormData(params: BatchGenerateQuestionsParams): FormData {
  const formData = new FormData()
  if (params.file) {
    formData.append('file', params.file)
  }
  if (params.textContent) {
    formData.append('textContent', params.textContent)
  }
  if (params.grade) {
    formData.append('grade', params.grade.toString())
  }
  if (params.topic) {
    formData.append('topic', params.topic)
  }
  if (params.questionType) {
    formData.append('questionType', params.questionType)
  }
  if (params.includeExplanation !== undefined) {
    formData.append('includeExplanation', params.includeExplanation.toString())
  }
  if (params.includeCanvasDiagram !== undefined) {
    formData.append('includeCanvasDiagram', params.includeCanvasDiagram.toString())
  }
  return formData
}

export const aiBatchQuestionService = {
  /**
   * Gọi API Backend /api/v1/ai/batch-generate-questions để bóc tách và tạo hàng loạt bài tập từ file/text bằng AI (đồng bộ)
   */
  async batchGenerateQuestions(params: BatchGenerateQuestionsParams): Promise<BatchGenerateQuestionsResponseDTO> {
    const formData = buildFormData(params)
    const response = await axiosInstance.post<BatchGenerateQuestionsResponseDTO>(
      '/ai/batch-generate-questions',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * Bóc tách và sinh bài tập hàng loạt bất đồng bộ qua Redis Queue
   */
  async batchGenerateQuestionsAsync(
    params: BatchGenerateQuestionsParams,
    options?: {
      onStatusChange?: (status: AiJobStatus, message?: string) => void
      signal?: AbortSignal
    }
  ): Promise<BatchGenerateQuestionsResponseDTO> {
    const formData = buildFormData(params)
    const response = await axiosInstance.post<AiJobSubmitResponse>(
      '/ai/batch-generate-questions?async=true',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: options?.signal,
      }
    )
    return aiJobService.waitForAiJob<BatchGenerateQuestionsResponseDTO>(response.data.jobId, {
      onStatusChange: options?.onStatusChange,
      signal: options?.signal,
    })
  },
}

