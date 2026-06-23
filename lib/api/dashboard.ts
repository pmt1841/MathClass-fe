import api from '@/lib/axios'

export interface TeacherDashboardStats {
  teachingClasses: number
  managedStudents: number
  assignmentsToGrade: number
  pendingJoinRequests: number
}

export const dashboardApi = {
  getTeacherStats: async (): Promise<TeacherDashboardStats> => {
    const response = await api.get('/dashboard/teacher-stats')
    return response.data
  },
}
