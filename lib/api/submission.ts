import api from '@/lib/axios'

export interface SubmissionResponse {
  id: number
  assignmentId: number
  studentId: number
  studentName: string
  content: string
  status: 'DRAFT' | 'SUBMITTED'
  score: number | null
  submittedAt: string | null
  updatedAt: string
}

export const submissionApi = {
  createSubmission: async (assignmentId: number, content: string, status: 'DRAFT' | 'SUBMITTED') => {
    const response = await api.post<SubmissionResponse>(`/submissions`, {
      assignmentId,
      content,
      status
    })
    return response.data
  },

  updateSubmission: async (submissionId: number, content: string, status: 'DRAFT' | 'SUBMITTED') => {
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

  getSubmissionsByAssignment: async (assignmentId: number) => {
    const response = await api.get<SubmissionResponse[]>(`/submissions?assignmentId=${assignmentId}`)
    return response.data
  }
}
