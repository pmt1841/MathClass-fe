import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useLibraryAssignments,
  useLibraryAssignmentDetail,
  useLibrarySheets,
  useCloneAssignment,
  useCloneSheet,
  useUpdateVisibility,
} from '@/hooks/useLibrary'
import { libraryService, LibrarySearchParams, UpdateVisibilityPayload } from '@/services/libraryService'

vi.mock('@/services/libraryService', () => ({
  libraryService: {
    getPublicAssignments: vi.fn(),
    getPublicAssignmentDetail: vi.fn(),
    getPublicSheets: vi.fn(),
    cloneAssignment: vi.fn(),
    cloneSheet: vi.fn(),
    updateVisibility: vi.fn(),
  },
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useLibrary hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useLibraryAssignments', () => {
    it('gọi libraryService.getPublicAssignments với params tìm kiếm', async () => {
      const searchParams: LibrarySearchParams = {
        keyword: 'Hình không gian',
        page: 0,
        size: 12,
      }
      const mockResult = {
        content: [
          { id: 1, title: 'Bài tập hình không gian 11', visibility: 'PUBLIC' },
        ],
        totalPages: 1,
        totalElements: 1,
      }
      vi.mocked(libraryService.getPublicAssignments).mockResolvedValueOnce(mockResult as any)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useLibraryAssignments(searchParams), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(libraryService.getPublicAssignments).toHaveBeenCalledWith(searchParams)
      expect(result.current.data).toEqual(mockResult)
    })

    it('không gọi API khi enabled = false', () => {
      const searchParams: LibrarySearchParams = {
        keyword: 'Toán',
        enabled: false,
      }

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useLibraryAssignments(searchParams), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.fetchStatus).toBe('idle')
      expect(libraryService.getPublicAssignments).not.toHaveBeenCalled()
    })
  })

  describe('useLibraryAssignmentDetail', () => {
    it('gọi libraryService.getPublicAssignmentDetail khi id có giá trị', async () => {
      const mockDetail = { id: 10, title: 'Bài tập tích phân 12', content: 'Nội dung tích phân' }
      vi.mocked(libraryService.getPublicAssignmentDetail).mockResolvedValueOnce(mockDetail as any)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useLibraryAssignmentDetail(10), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(libraryService.getPublicAssignmentDetail).toHaveBeenCalledWith(10)
      expect(result.current.data).toEqual(mockDetail)
    })

    it('không gọi API khi id là null (enabled = false)', () => {
      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useLibraryAssignmentDetail(null), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.fetchStatus).toBe('idle')
      expect(libraryService.getPublicAssignmentDetail).not.toHaveBeenCalled()
    })
  })

  describe('useLibrarySheets', () => {
    it('gọi libraryService.getPublicSheets với queryParams', async () => {
      const searchParams: LibrarySearchParams = {
        page: 0,
        size: 10,
      }
      const mockResult = {
        content: [
          { id: 10, title: 'Phiếu trắc nghiệm công khai', isSheet: true },
        ],
        totalPages: 1,
        totalElements: 1,
      }
      vi.mocked(libraryService.getPublicSheets).mockResolvedValueOnce(mockResult as any)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useLibrarySheets(searchParams), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(libraryService.getPublicSheets).toHaveBeenCalledWith(searchParams)
      expect(result.current.data).toEqual(mockResult)
    })
  })

  describe('useCloneAssignment & useCloneSheet', () => {
    it('useCloneAssignment - clone bài tập đơn lẻ và invalidate cache assignments và library', async () => {
      const clonedAssignment = { id: 100, title: 'Bài tập nhân bản' }
      vi.mocked(libraryService.cloneAssignment).mockResolvedValueOnce(clonedAssignment as any)

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCloneAssignment(), {
        wrapper: createWrapper(queryClient),
      })

      await act(async () => {
        await result.current.mutateAsync({ id: 1, title: 'Bài tập nhân bản' })
      })

      expect(libraryService.cloneAssignment).toHaveBeenCalledWith(1, 'Bài tập nhân bản')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['assignments'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['library'] })
    })

    it('useCloneSheet - clone phiếu bài tập và invalidate cache', async () => {
      const clonedSheet = { id: 200, title: 'Phiếu nhân bản' }
      vi.mocked(libraryService.cloneSheet).mockResolvedValueOnce(clonedSheet as any)

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCloneSheet(), {
        wrapper: createWrapper(queryClient),
      })

      await act(async () => {
        await result.current.mutateAsync({ id: 10, title: 'Phiếu nhân bản' })
      })

      expect(libraryService.cloneSheet).toHaveBeenCalledWith(10, 'Phiếu nhân bản')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['assignments'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['library'] })
    })
  })

  describe('useUpdateVisibility', () => {
    it('cập nhật visibility bài tập và invalidate queries liên quan', async () => {
      const payload: UpdateVisibilityPayload = {
        id: 5,
        visibility: 'PUBLIC',
        isSheet: false,
      }
      vi.mocked(libraryService.updateVisibility).mockResolvedValueOnce(undefined as any)

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateVisibility(), {
        wrapper: createWrapper(queryClient),
      })

      await act(async () => {
        await result.current.mutateAsync(payload)
      })

      expect(libraryService.updateVisibility).toHaveBeenCalledWith(payload)
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['assignments'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['library'] })
    })
  })
})
