import api from '@/lib/axios'

export interface TeacherDashboardStats {
  teachingClasses: number
  managedStudents: number
  assignmentsToGrade: number
  pendingJoinRequests: number
  openAssignments: number
}

export interface PendingSubmission {
  id: number
  studentName: string
  assignmentTitle: string
  className: string
  classCode: string
  submittedAt: string
}

export const dashboardApi = {
  getTeacherStats: async (): Promise<TeacherDashboardStats> => {
    const response = await api.get('/dashboard/teacher-stats')
    return response.data
  },
  getPendingSubmissions: async (limit = 10): Promise<PendingSubmission[]> => {
    const response = await api.get(`/dashboard/pending-submissions?limit=${limit}`)
    return response.data
  },
  getStudentStats: async () => {
    const response = await api.get('/dashboard/student-stats')
    return response.data
  },
  getStudentPendingTasks: async (limit = 10) => {
    const response = await api.get(`/dashboard/student-pending-tasks?limit=${limit}`)
    return response.data
  },
  getStudentGradedTasks: async (limit = 10) => {
    const response = await api.get(`/dashboard/student-graded-tasks?limit=${limit}`)
    return response.data
  }
}
