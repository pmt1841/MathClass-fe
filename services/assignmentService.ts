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

export interface GetAssignmentsParams {
  status?: string
  classCode?: string
  keyword?: string
}

export interface PublishPayload {
  targets: { classCode: string; deadline: string }[]
}

export const assignmentService = {
  getAssignmentById: async (assignmentId: number) => {
    const response = await api.get<AssignmentResponse>(`/assignments/${assignmentId}`)
    return response.data
  },

  getAssignments: async (params: GetAssignmentsParams) => {
    const response = await api.get('/assignments', { params })
    return response.data
  },

  deleteAssignment: async (id: number) => {
    await api.delete(`/assignments/${id}`)
  },

  publishAssignment: async (assignmentId: number, payload: PublishPayload) => {
    const response = await api.put(`/assignments/${assignmentId}/publish`, payload)
    return response.data
  },

  createAssignment: async (data: any) => {
    const response = await api.post('/assignments/create', data)
    return response.data
  },

  updateAssignment: async (assignmentId: number, data: any) => {
    const response = await api.put(`/assignments/${assignmentId}`, data)
    return response.data
  },

  uploadImage: async (formData: FormData) => {
    const response = await api.post('/assignments/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  extractText: async (formData: FormData) => {
    const response = await api.post('/assignments/extract-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}
