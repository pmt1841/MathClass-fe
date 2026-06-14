import api from '@/lib/axios'

export interface SubmissionResponse {
  id: number
  assignmentId: number
  studentId: number
  studentName: string
  content: string
  status: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'LATE'
  score: number | null
  submittedAt: string | null
  updatedAt: string
}

export interface PageResponse<T> {
  content: T[]
  pageable: any
  last: boolean
  totalPages: number
  totalElements: number
  size: number
  number: number
  sort: any
  first: boolean
  numberOfElements: number
  empty: boolean
}

export interface GetSubmissionsParams {
  assignmentId: number
  page?: number
  size?: number
  status?: string
  keyword?: string
}

export const submissionApi = {
  createSubmission: async (assignmentId: number, content: string, status: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'LATE') => {
    const response = await api.post<SubmissionResponse>(`/submissions`, {
      assignmentId,
      content,
      status
    })
    return response.data
  },

  updateSubmission: async (submissionId: number, content: string, status: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'LATE') => {
    const response = await api.put<SubmissionResponse>(`/submissions/${submissionId}`, {
      content,
      status
    })
    return response.data
  },

  unsubmit: async (submissionId: number) => {
    const response = await api.put<SubmissionResponse>(`/submissions/${submissionId}/unsubmit`)
    return response.data
  },

  gradeSubmission: async (submissionId: number, score: number) => {
    const response = await api.put<SubmissionResponse>(`/submissions/${submissionId}/grade`, {
      score
    })
    return response.data
  },

  getMySubmission: async (assignmentId: number) => {
    const response = await api.get<SubmissionResponse>(`/submissions/my-submission?assignmentId=${assignmentId}`)
    return response.data
  },

  getSubmissionsByAssignment: async (params: GetSubmissionsParams) => {
    const response = await api.get<PageResponse<SubmissionResponse>>('/submissions', { params })
    return response.data
  }
}
