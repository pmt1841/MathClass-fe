import api from '@/lib/axios'

export interface JoinRequestRequest {
  classCode: string
}

export interface JoinRequestResponse {
  id: number
  studentId: number
  studentName: string
  studentEmail: string
  classCode: string
  className: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requestedAt: string
}

export interface ProcessJoinRequest {
  status: 'APPROVED' | 'REJECTED'
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export const joinRequestService = {
  requestToJoinClass: async (data: JoinRequestRequest): Promise<JoinRequestResponse> => {
    const response = await api.post<JoinRequestResponse>('/classrooms/join-requests', data)
    return response.data
  },

  getMyJoinRequests: async (): Promise<JoinRequestResponse[]> => {
    const response = await api.get<JoinRequestResponse[]>('/classrooms/join-requests/me')
    return response.data
  },

  getPendingRequests: async (classCode: string): Promise<JoinRequestResponse[]> => {
    const response = await api.get<JoinRequestResponse[]>(`/classrooms/${classCode}/join-requests`)
    return response.data
  },

  processJoinRequest: async (requestId: number, data: ProcessJoinRequest): Promise<JoinRequestResponse> => {
    const response = await api.put<JoinRequestResponse>(`/classrooms/join-requests/${requestId}`, data)
    return response.data
  }
}
