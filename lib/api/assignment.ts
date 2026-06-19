import api from '@/lib/axios'

export interface AssignmentResponse {
  id: number
  title: string
  description: string
  content: string
  classroomId: number
  dueDate: string
  createdAt: string
  updatedAt: string
}

export const assignmentApi = {
  getAssignmentById: async (assignmentId: number) => {
    const response = await api.get<AssignmentResponse>(`/assignments/${assignmentId}`)
    return response.data
  }
}
