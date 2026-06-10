import api from '@/lib/axios'

export interface SubmissionResponse {
  id: number
  assignmentId: number
  studentId: number
  studentName: string
  content: string
  status: 'DRAFT' | 'SUBMITTED'
  submittedAt: string | null
  updatedAt: string
}

export const submissionApi = {
  // Nộp bài hoặc Lưu nháp (dùng PUT để create/update chung)
  saveSubmission: async (assignmentId: number, content: string, status: 'DRAFT' | 'SUBMITTED') => {
    const response = await api.put<SubmissionResponse>(`/assignments/${assignmentId}/submissions/my-submission`, {
      content,
      status
    })
    return response.data
  },

  // Lấy bài nộp của user hiện tại (Học sinh)
  getMySubmission: async (assignmentId: number) => {
    const response = await api.get<SubmissionResponse>(`/assignments/${assignmentId}/submissions/my-submission`)
    return response.data
  },

  // Lấy danh sách tất cả bài nộp (Giáo viên)
  getSubmissionsByAssignment: async (assignmentId: number) => {
    const response = await api.get<SubmissionResponse[]>(`/assignments/${assignmentId}/submissions`)
    return response.data
  }
}
