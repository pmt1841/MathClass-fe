import api from '@/lib/axios'

export interface StudentHintResponse {
  id: number
  submissionId: number
  hintNumber: number
  maxHints: number
  remainingHints: number
  hintContent: string
  createdAt: string
}

export interface SubmissionHintItemDTO {
  id: number
  hintNumber: number
  studentSnapshotContent: string
  aiHintContent: string
  createdAt: string
}

export interface HintHistoryResponse {
  submissionId: number
  totalUsed: number
  maxHints: number
  remainingHints: number
  hints: SubmissionHintItemDTO[]
}

export const submissionHintsService = {
  requestHint: async (assignmentId: number, currentContent: string): Promise<StudentHintResponse> => {
    const res = await api.post<StudentHintResponse>(`/submissions/assignments/${assignmentId}/hints`, { currentContent })
    return res.data
  },

  getHintHistory: async (submissionId: number): Promise<HintHistoryResponse> => {
    const res = await api.get<HintHistoryResponse>(`/submissions/${submissionId}/hints`)
    return res.data
  }
}

// Export legacy alias for backward compatibility if referenced elsewhere
export const submissionHintApi = submissionHintsService
