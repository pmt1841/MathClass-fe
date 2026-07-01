import api from '@/lib/axios'

export interface AssignmentImage {
  id: number
  imageCode: string
  imageUrl: string
}

export interface AssignmentDrawing {
  id: number
  shapeCode: string
  jsxGraphData: string
}

export interface AssignmentResponse {
  id: number
  title: string
  description: string
  content: string
  classroomId: number
  dueDate: string
  createdAt: string
  updatedAt: string
  images?: AssignmentImage[]
  drawings?: AssignmentDrawing[]
}

export const assignmentApi = {
  getAssignmentById: async (assignmentId: number) => {
    const response = await api.get<AssignmentResponse>(`/assignments/${assignmentId}`)
    return response.data
  }
}
