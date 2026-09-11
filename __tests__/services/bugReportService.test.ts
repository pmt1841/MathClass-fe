import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import {
  bugReportService,
  CreateBugReportPayload,
  BugReportResponse,
} from '@/services/bugReportService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('bugReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sendPublicOtp - gọi POST /bug-reports/public/send-otp với email', async () => {
    const mockRes = { message: 'OTP đã gửi' }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockRes })

    const result = await bugReportService.sendPublicOtp('guest@example.com')

    expect(api.post).toHaveBeenCalledWith('/bug-reports/public/send-otp', { email: 'guest@example.com' })
    expect(result).toEqual(mockRes)
  })

  it('createPublicReport - gọi POST /bug-reports/public với payload gửi từ guest', async () => {
    const payload: CreateBugReportPayload = {
      reporterEmail: 'guest@example.com',
      reporterName: 'Khách',
      errorType: 'LOGIN_ACCOUNT',
      description: 'Không thể đăng nhập bằng Google',
      otp: '123456',
    }
    const mockCreated: BugReportResponse = {
      id: 1,
      reporterEmail: payload.reporterEmail!,
      reporterName: payload.reporterName,
      errorType: payload.errorType,
      description: payload.description,
      status: 'PENDING',
      imageUrls: [],
      createdAt: '2026-09-11T10:00:00Z',
      updatedAt: '2026-09-11T10:00:00Z',
    }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockCreated })

    const result = await bugReportService.createPublicReport(payload)

    expect(api.post).toHaveBeenCalledWith('/bug-reports/public', payload)
    expect(result).toEqual(mockCreated)
  })

  it('createAuthenticatedReport - gọi POST /bug-reports cho người dùng đã đăng nhập', async () => {
    const payload: CreateBugReportPayload = {
      errorType: 'UI_KATEX',
      description: 'Lỗi hiển thị công thức phân số',
      imageUrls: ['https://example.com/bug.png'],
    }
    const mockCreated: BugReportResponse = {
      id: 2,
      userId: 10,
      reporterEmail: 'user@example.com',
      errorType: payload.errorType,
      description: payload.description,
      status: 'PENDING',
      imageUrls: payload.imageUrls || [],
      createdAt: '2026-09-11T10:05:00Z',
      updatedAt: '2026-09-11T10:05:00Z',
    }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockCreated })

    const result = await bugReportService.createAuthenticatedReport(payload)

    expect(api.post).toHaveBeenCalledWith('/bug-reports', payload)
    expect(result).toEqual(mockCreated)
  })

  it('getReports - gọi GET /admin/bug-reports với query params', async () => {
    const params = { status: 'PENDING' as const, page: 0, size: 10 }
    const mockPage = { content: [], totalPages: 0, totalElements: 0 }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockPage })

    const result = await bugReportService.getReports(params)

    expect(api.get).toHaveBeenCalledWith('/admin/bug-reports', { params })
    expect(result).toEqual(mockPage)
  })

  it('getReportById - gọi GET /admin/bug-reports/:id', async () => {
    const mockReport: BugReportResponse = {
      id: 5,
      reporterEmail: 'test@example.com',
      errorType: 'PERFORMANCE',
      status: 'IN_PROGRESS',
      imageUrls: [],
      createdAt: '2026-09-11T10:00:00Z',
      updatedAt: '2026-09-11T10:10:00Z',
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockReport })

    const result = await bugReportService.getReportById(5)

    expect(api.get).toHaveBeenCalledWith('/admin/bug-reports/5')
    expect(result).toEqual(mockReport)
  })

  it('updateReportStatus - gọi PATCH /admin/bug-reports/:id/status cập nhật trạng thái xử lý', async () => {
    const mockUpdated: BugReportResponse = {
      id: 5,
      reporterEmail: 'test@example.com',
      errorType: 'PERFORMANCE',
      status: 'RESOLVED',
      imageUrls: [],
      createdAt: '2026-09-11T10:00:00Z',
      updatedAt: '2026-09-11T10:15:00Z',
    }
    vi.mocked(api.patch).mockResolvedValueOnce({ data: mockUpdated })

    const result = await bugReportService.updateReportStatus(5, 'RESOLVED')

    expect(api.patch).toHaveBeenCalledWith('/admin/bug-reports/5/status', { status: 'RESOLVED' })
    expect(result.status).toBe('RESOLVED')
  })

  it('uploadImage - gọi POST /assignments/images với FormData multipart', async () => {
    const mockFile = new File(['dummy'], 'bug.png', { type: 'image/png' })
    const mockRes = { url: 'https://storage.example.com/bug.png' }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockRes })

    const result = await bugReportService.uploadImage(mockFile)

    expect(api.post).toHaveBeenCalledWith(
      '/assignments/images',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
    expect(result).toEqual(mockRes)
  })

  it('uploadPublicImage - gọi POST /bug-reports/public/upload-image với FormData multipart', async () => {
    const mockFile = new File(['dummy-public'], 'guest-bug.png', { type: 'image/png' })
    const mockRes = { url: 'https://storage.example.com/guest-bug.png' }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockRes })

    const result = await bugReportService.uploadPublicImage(mockFile)

    expect(api.post).toHaveBeenCalledWith(
      '/bug-reports/public/upload-image',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
    expect(result).toEqual(mockRes)
  })
})
