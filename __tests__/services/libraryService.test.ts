import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { libraryService, LibrarySearchParams, UpdateVisibilityPayload } from '@/services/libraryService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('libraryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getPublicAssignments - gọi GET /library/assignments kèm params', async () => {
    const params: LibrarySearchParams = { keyword: 'Toán 10', page: 0, size: 10 }
    const mockData = { content: [{ id: 1, title: 'Bài tập 1' }], totalElements: 1 }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData })

    const result = await libraryService.getPublicAssignments(params)

    expect(api.get).toHaveBeenCalledWith('/library/assignments', { params })
    expect(result).toEqual(mockData)
  })

  it('getPublicSheets - gọi GET /library/assignment-sheets kèm params', async () => {
    const params: LibrarySearchParams = { keyword: 'Phiếu ôn tập', page: 0, size: 10 }
    const mockData = { content: [{ id: 2, title: 'Phiếu 1' }], totalElements: 1 }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData })

    const result = await libraryService.getPublicSheets(params)

    expect(api.get).toHaveBeenCalledWith('/library/assignment-sheets', { params })
    expect(result).toEqual(mockData)
  })

  it('cloneAssignment - gọi POST /library/assignments/:id/clone với title mới', async () => {
    const mockCloned = { id: 10, title: 'Bài tập nhân bản' }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockCloned })

    const result = await libraryService.cloneAssignment(1, 'Bài tập nhân bản')

    expect(api.post).toHaveBeenCalledWith('/library/assignments/1/clone', { title: 'Bài tập nhân bản' })
    expect(result).toEqual(mockCloned)
  })

  it('cloneSheet - gọi POST /library/assignment-sheets/:id/clone với title mới', async () => {
    const mockCloned = { id: 20, title: 'Phiếu nhân bản' }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockCloned })

    const result = await libraryService.cloneSheet(2, 'Phiếu nhân bản')

    expect(api.post).toHaveBeenCalledWith('/library/assignment-sheets/2/clone', { title: 'Phiếu nhân bản' })
    expect(result).toEqual(mockCloned)
  })

  it('updateVisibility - gọi PATCH endpoint bài tập đơn lẻ khi isSheet = false', async () => {
    const payload: UpdateVisibilityPayload = { id: 5, visibility: 'PUBLIC', isSheet: false }
    const mockResponse = { id: 5, visibility: 'PUBLIC' }
    vi.mocked(api.patch).mockResolvedValueOnce({ data: mockResponse })

    const result = await libraryService.updateVisibility(payload)

    expect(api.patch).toHaveBeenCalledWith('/assignments/5/visibility', { visibility: 'PUBLIC' })
    expect(result).toEqual(mockResponse)
  })

  it('updateVisibility - gọi PATCH endpoint phiếu bài tập khi isSheet = true', async () => {
    const payload: UpdateVisibilityPayload = { id: 8, visibility: 'PRIVATE', isSheet: true }
    const mockResponse = { id: 8, visibility: 'PRIVATE' }
    vi.mocked(api.patch).mockResolvedValueOnce({ data: mockResponse })

    const result = await libraryService.updateVisibility(payload)

    expect(api.patch).toHaveBeenCalledWith('/assignment-sheets/8/visibility', { visibility: 'PRIVATE' })
    expect(result).toEqual(mockResponse)
  })
})
