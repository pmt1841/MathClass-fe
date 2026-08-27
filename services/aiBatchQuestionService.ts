import axiosInstance from '@/lib/axios'

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

export const aiBatchQuestionService = {
  /**
   * Gọi API Backend /api/v1/ai/batch-generate-questions để bóc tách và tạo hàng loạt bài tập từ file/text bằng AI
   */
  async batchGenerateQuestions(params: BatchGenerateQuestionsParams): Promise<BatchGenerateQuestionsResponseDTO> {
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
}
