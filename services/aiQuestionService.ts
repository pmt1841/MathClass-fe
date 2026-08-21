import axiosInstance from '@/lib/axios'

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
   * Gọi API Backend /api/v1/ai/generate-question để sinh câu hỏi bằng AI (Gemini 2.0)
   */
  async generateQuestion(dto: GenerateQuestionRequestDTO): Promise<AiGeneratedQuestionDTO> {
    const response = await axiosInstance.post<AiGeneratedQuestionDTO>('/ai/generate-question', dto)
    return response.data
  }
}
