import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAssignments, useDeleteAssignment } from '@/hooks/useAssignments'
import { assignmentService } from '@/services/assignmentService'

vi.mock('@/services/assignmentService', () => ({
  assignmentService: {
    getAssignments: vi.fn(),
    getAssignmentSheets: vi.fn(),
    deleteAssignment: vi.fn(),
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

describe('useAssignments hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAssignments query', () => {
    it('Teacher tab DRAFT: gọi getAssignments với status DRAFT', async () => {
      const mockData = {
        content: [
          { id: 1, title: 'Bài tập nháp 1', createdAt: '2026-09-01T10:00:00Z' },
          { id: 2, title: 'Bài tập nháp 2', createdAt: '2026-09-02T10:00:00Z' },
        ],
        totalPages: 1,
        totalElements: 2,
      }
      vi.mocked(assignmentService.getAssignments).mockResolvedValueOnce(mockData)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(
        () =>
          useAssignments({
            userRole: 'TEACHER',
            activeTab: 'DRAFT',
            searchQuery: '',
            selectedClassCode: '',
          }),
        { wrapper: createWrapper(queryClient) }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(assignmentService.getAssignments).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DRAFT', page: 0, size: 6 })
      )
      expect(result.current.data?.items.length).toBe(2)
      // Kiểm tra sắp xếp mới nhất lên đầu
      expect(result.current.data?.items[0].id).toBe(2)
    })

    it('Teacher tab SHEET: gọi getAssignmentSheets', async () => {
      const mockSheetData = {
        content: [{ id: 10, title: 'Phiếu bài tập số 1', createdAt: '2026-09-01T10:00:00Z' }],
        totalPages: 1,
        totalElements: 1,
      }
      vi.mocked(assignmentService.getAssignmentSheets).mockResolvedValueOnce(mockSheetData)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(
        () =>
          useAssignments({
            userRole: 'TEACHER',
            activeTab: 'SHEET',
            searchQuery: '',
            selectedClassCode: '',
          }),
        { wrapper: createWrapper(queryClient) }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(assignmentService.getAssignmentSheets).toHaveBeenCalled()
      expect(result.current.data?.items[0].title).toBe('Phiếu bài tập số 1')
    })

    it('Student với assignmentType SINGLE: gọi getAssignments với status PUBLISHED', async () => {
      const mockData = {
        content: [{ id: 5, title: 'Bài tập hình học', createdAt: '2026-09-03T10:00:00Z' }],
        totalPages: 1,
        totalElements: 1,
      }
      vi.mocked(assignmentService.getAssignments).mockResolvedValueOnce(mockData)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(
        () =>
          useAssignments({
            userRole: 'STUDENT',
            activeTab: 'ALL',
            searchQuery: 'Hình học',
            selectedClassCode: 'MATH101',
            assignmentType: 'SINGLE',
          }),
        { wrapper: createWrapper(queryClient) }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(assignmentService.getAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PUBLISHED',
          classCode: 'MATH101',
          keyword: 'Hình học',
        })
      )
      expect(result.current.data?.items[0].id).toBe(5)
    })
  })

  describe('useDeleteAssignment mutation', () => {
    it('gọi assignmentService.deleteAssignment và xóa thành công', async () => {
      vi.mocked(assignmentService.deleteAssignment).mockResolvedValueOnce(undefined)

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useDeleteAssignment(), {
        wrapper: createWrapper(queryClient),
      })

      await act(async () => {
        await result.current.mutateAsync(10)
      })

      expect(assignmentService.deleteAssignment).toHaveBeenCalledWith(10, expect.anything())
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['assignments'] })
    })
  })
})
