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

export interface SheetSiblingDto {
  id: number
  title?: string
  submissionStatus?: string
}

export interface AssignmentResponse {
  id: number
  title: string
  description?: string
  content?: string
  classroomId?: number
  deadline?: string
  dueDate?: string
  createdAt?: string
  updatedAt?: string
  maxScore?: number
  isOpen?: boolean
  hasSubmissions?: boolean
  submissionStatus?: string
  submissionCreatedAt?: string
  submissionUpdatedAt?: string
  submissionScore?: number
  teacherId?: number
  teacherName?: string
  classCode?: string
  className?: string
  publishedClassCodes?: string[]
  images?: AssignmentImage[]
  drawings?: AssignmentDrawing[]
  sheetId?: number
  sheetTitle?: string
  sheetSiblings?: SheetSiblingDto[]
}

export interface GetAssignmentsParams {
  status?: string
  classCode?: string
  keyword?: string
  page?: number
  size?: number
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

  getAssignmentSheets: async (params: GetAssignmentsParams) => {
    const response = await api.get('/assignment-sheets', { params })
    return response.data
  },

  deleteAssignment: async (id: number) => {
    await api.delete(`/assignments/${id}`)
  },

  deleteAssignmentSheet: async (id: number) => {
    await api.delete(`/assignment-sheets/${id}`)
  },

  updateAssignmentSheet: async (id: number, data: { title: string; description?: string; itemScores?: { assignmentId: number; maxScore: number }[] }) => {
    const response = await api.put(`/assignment-sheets/${id}`, data)
    return response.data
  },

  getCompletedStudentsBySheet: async (sheetId: number, params?: { classCode?: string; page?: number; size?: number; sort?: string }) => {
    const response = await api.get(`/assignment-sheets/${sheetId}/completed-students`, { params })
    return response.data
  },

  publishAssignment: async (assignmentId: number, payload: PublishPayload) => {
    const response = await api.put(`/assignments/${assignmentId}/publish`, payload)
    return response.data
  },

  publishAssignmentSheet: async (payload: { masterSheetId?: number; title: string; description: string; assignmentIds: number[]; itemScores?: { assignmentId: number; maxScore: number }[]; targets: { classCode: string; deadline: string }[] }) => {
    const response = await api.post(`/assignment-sheets`, payload)
    return response.data
  },

  createAssignment: async (data: any) => {
    const response = await api.post('/assignments', data)
    return response.data
  },

  updateAssignment: async (assignmentId: number, data: any) => {
    const response = await api.put(`/assignments/${assignmentId}`, data)
    return response.data
  },

  uploadImage: async (formData: FormData, onProgress?: (progressEvent: any) => void) => {
    const response = await api.post('/assignments/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
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
