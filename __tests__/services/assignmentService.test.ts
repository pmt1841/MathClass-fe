import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { assignmentService } from '@/services/assignmentService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('assignmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getTags gọi GET /tags với params query nếu có', async () => {
    const mockTags = [{ id: 1, name: 'Lớp 10', type: 'GRADE' }]
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockTags })

    const result = await assignmentService.getTags('Lớp 10')

    expect(api.get).toHaveBeenCalledWith('/tags', { params: { query: 'Lớp 10' } })
    expect(result).toEqual(mockTags)
  })

  it('getAssignmentById gọi GET /assignments/{id}', async () => {
    const mockAssignment = { id: 10, title: 'Bài tập Đại số' }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockAssignment })

    const result = await assignmentService.getAssignmentById(10)

    expect(api.get).toHaveBeenCalledWith('/assignments/10')
    expect(result).toEqual(mockAssignment)
  })

  it('getAssignments gọi GET /assignments với query params', async () => {
    const mockData = { content: [{ id: 1 }], totalPages: 1 }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData })

    const params = { status: 'PUBLISHED', page: 0, size: 10 }
    const result = await assignmentService.getAssignments(params)

    expect(api.get).toHaveBeenCalledWith('/assignments', { params })
    expect(result).toEqual(mockData)
  })

  it('getAssignmentSheets gọi GET /assignment-sheets với query params', async () => {
    const mockData = { content: [{ id: 2 }], totalPages: 1 }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData })

    const params = { keyword: 'Toán', page: 0, size: 5 }
    const result = await assignmentService.getAssignmentSheets(params)

    expect(api.get).toHaveBeenCalledWith('/assignment-sheets', { params })
    expect(result).toEqual(mockData)
  })

  it('deleteAssignment gọi DELETE /assignments/{id}', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null })

    await assignmentService.deleteAssignment(10)

    expect(api.delete).toHaveBeenCalledWith('/assignments/10')
  })

  it('deleteAssignmentSheet gọi DELETE /assignment-sheets/{id}', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null })

    await assignmentService.deleteAssignmentSheet(20)

    expect(api.delete).toHaveBeenCalledWith('/assignment-sheets/20')
  })

  it('updateAssignmentSheet gọi PUT /assignment-sheets/{id} với payload', async () => {
    const mockRes = { id: 20, title: 'Phiếu mới' }
    vi.mocked(api.put).mockResolvedValueOnce({ data: mockRes })

    const payload = { title: 'Phiếu mới', description: 'Mô tả mới' }
    const result = await assignmentService.updateAssignmentSheet(20, payload)

    expect(api.put).toHaveBeenCalledWith('/assignment-sheets/20', payload)
    expect(result).toEqual(mockRes)
  })

  it('publishAssignment gọi PUT /assignments/{id}/publish với targets', async () => {
    const mockRes = { success: true }
    vi.mocked(api.put).mockResolvedValueOnce({ data: mockRes })

    const payload = { targets: [{ classCode: 'MATH101', deadline: '2099-12-31T23:59:59' }] }
    const result = await assignmentService.publishAssignment(10, payload)

    expect(api.put).toHaveBeenCalledWith('/assignments/10/publish', payload)
    expect(result).toEqual(mockRes)
  })

  it('createAssignment gọi POST /assignments với data', async () => {
    const mockRes = { id: 10, title: 'Tạo bài mới' }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockRes })

    const data = { title: 'Tạo bài mới', content: 'Nội dung' }
    const result = await assignmentService.createAssignment(data)

    expect(api.post).toHaveBeenCalledWith('/assignments', data)
    expect(result).toEqual(mockRes)
  })

  it('createBatchAssignments gọi POST /assignments/batch với mảng data', async () => {
    const mockRes = [{ id: 10 }, { id: 11 }]
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockRes })

    const dataList = [{ title: 'Bài 1' }, { title: 'Bài 2' }]
    const result = await assignmentService.createBatchAssignments(dataList)

    expect(api.post).toHaveBeenCalledWith('/assignments/batch', dataList)
    expect(result).toEqual(mockRes)
  })

  it('updateAssignment gọi PUT /assignments/{id} với data', async () => {
    const mockRes = { id: 10, title: 'Cập nhật' }
    vi.mocked(api.put).mockResolvedValueOnce({ data: mockRes })

    const data = { title: 'Cập nhật' }
    const result = await assignmentService.updateAssignment(10, data)

    expect(api.put).toHaveBeenCalledWith('/assignments/10', data)
    expect(result).toEqual(mockRes)
  })

  it('uploadImage gửi FormData lên POST /assignments/images với multipart/form-data', async () => {
    const mockRes = { imageCode: 'IMG123', imageUrl: 'https://cdn/img.png' }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockRes })

    const formData = new FormData()
    const onProgress = vi.fn()
    const result = await assignmentService.uploadImage(formData, onProgress)

    expect(api.post).toHaveBeenCalledWith('/assignments/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
    expect(result).toEqual(mockRes)
  })

  it('toggleAllowResubmit gọi PATCH /assignments/{id}/allow-resubmit', async () => {
    const mockRes = { id: 10, allowResubmit: true }
    vi.mocked(api.patch).mockResolvedValueOnce({ data: mockRes })

    const result = await assignmentService.toggleAllowResubmit(10, true)

    expect(api.patch).toHaveBeenCalledWith('/assignments/10/allow-resubmit', null, {
      params: { allowResubmit: true },
    })
    expect(result).toEqual(mockRes)
  })
})
