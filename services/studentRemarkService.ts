import api from '@/lib/axios'

export interface StudentRemark {
  id: number
  studentId: number
  studentName: string
  teacherId: number
  teacherName: string
  teacherAvatarUrl?: string
  strengths?: string
  weaknesses?: string
  generalAssessment?: string
  createdAt: string
  updatedAt: string
}

export interface CreateStudentRemarkPayload {
  strengths?: string
  weaknesses?: string
  generalAssessment?: string
}

export interface AiStudentRemarkEvaluatePayload {
  days?: number
  startDate?: string
  endDate?: string
}

export interface AiStudentRemarkEvaluationResult {
  startDate: string
  endDate: string
  totalAssignments: number
  completedAssignments: number
  overdueAssignments?: number
  activeIncompleteAssignments?: number
  averageScore?: number | null
  strengths: string
  weaknesses: string
  generalAssessment: string
}

export const studentRemarkService = {
  getRemarks: async (classCode: string, studentId: number): Promise<StudentRemark[]> => {
    const res = await api.get(`/classrooms/${classCode}/students/${studentId}/remarks`)
    return Array.isArray(res.data) ? res.data : []
  },

  createRemark: async (
    classCode: string,
    studentId: number,
    payload: CreateStudentRemarkPayload
  ): Promise<StudentRemark> => {
    const res = await api.post(`/classrooms/${classCode}/students/${studentId}/remarks`, payload)
    return res.data
  },

  deleteRemark: async (classCode: string, studentId: number, remarkId: number): Promise<void> => {
    await api.delete(`/classrooms/${classCode}/students/${studentId}/remarks/${remarkId}`)
  },

  evaluateWithAi: async (
    classCode: string,
    studentId: number,
    payload: AiStudentRemarkEvaluatePayload
  ): Promise<AiStudentRemarkEvaluationResult> => {
    const res = await api.post(
      `/classrooms/${classCode}/students/${studentId}/remarks/ai-evaluate`,
      payload
    )
    return res.data
  },
}
