import api from '@/lib/axios'

export type BugErrorType =
  | 'LOGIN_ACCOUNT'
  | 'UI_KATEX'
  | 'SUBMISSION_PROBLEM'
  | 'PERFORMANCE'
  | 'OTHER'

export type BugReportStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'

export interface CreateBugReportPayload {
  reporterEmail?: string
  reporterName?: string
  errorType: BugErrorType
  description?: string
  imageUrls?: string[]
}

export interface BugReportResponse {
  id: number
  reporterEmail: string
  reporterName?: string
  userId?: number
  errorType: BugErrorType
  description?: string
  status: BugReportStatus
  imageUrls: string[]
  createdAt: string
  updatedAt: string
}

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export const bugReportService = {
  // Gửi báo cáo từ màn hình login (công khai, không cần token)
  createPublicReport: async (payload: CreateBugReportPayload) => {
    const response = await api.post('/bug-reports/public', payload)
    return response.data
  },

  // Gửi báo cáo khi đã đăng nhập (Học sinh/Giáo viên)
  createAuthenticatedReport: async (payload: CreateBugReportPayload) => {
    const response = await api.post('/bug-reports', payload)
    return response.data
  },

  // Lấy danh sách báo cáo cho Admin
  getReports: async (params?: { status?: BugReportStatus; page?: number; size?: number }) => {
    const response = await api.get('/admin/bug-reports', { params })
    return response.data
  },

  // Lấy chi tiết báo cáo cho Admin
  getReportById: async (id: number) => {
    const response = await api.get(`/admin/bug-reports/${id}`)
    return response.data
  },

  // Cập nhật trạng thái báo cáo cho Admin
  updateReportStatus: async (id: number, status: BugReportStatus) => {
    const response = await api.patch(`/admin/bug-reports/${id}/status`, { status })
    return response.data
  },

  // Upload file ảnh đính kèm cho người dùng đã đăng nhập
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/assignments/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Upload file ảnh đính kèm công khai (Dành cho Guest chưa đăng nhập)
  uploadPublicImage: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/bug-reports/public/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}
