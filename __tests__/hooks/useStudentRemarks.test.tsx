import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useStudentRemarks,
  useCreateStudentRemark,
  useDeleteStudentRemark,
  useAiStudentRemarkEvaluation,
} from '@/hooks/useStudentRemarks'
import { studentRemarkService, StudentRemark } from '@/services/studentRemarkService'

vi.mock('@/services/studentRemarkService', () => ({
  studentRemarkService: {
    getRemarks: vi.fn(),
    createRemark: vi.fn(),
    deleteRemark: vi.fn(),
    evaluateWithAi: vi.fn(),
    evaluateWithAiAsync: vi.fn(),
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
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useStudentRemarks hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useStudentRemarks', () => {
    it('lấy danh sách nhận xét thành công khi có classCode và studentId', async () => {
      const mockRemarks: StudentRemark[] = [
        {
          id: 1,
          studentId: 10,
          studentName: 'Lê Thị Bình',
          teacherId: 1,
          teacherName: 'Thầy A',
          strengths: 'Chăm chỉ',
          createdAt: '2026-08-27',
          updatedAt: '2026-08-27',
        },
      ]
      vi.mocked(studentRemarkService.getRemarks).mockResolvedValueOnce(mockRemarks)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useStudentRemarks('MATH101', 10), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(studentRemarkService.getRemarks).toHaveBeenCalledWith('MATH101', 10)
      expect(result.current.data).toEqual(mockRemarks)
    })

    it('không gọi service khi studentId là null (query disabled)', async () => {
      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useStudentRemarks('MATH101', null), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.fetchStatus).toBe('idle')
      expect(studentRemarkService.getRemarks).not.toHaveBeenCalled()
    })
  })

  describe('useCreateStudentRemark', () => {
    it('gọi service createRemark và invalidate cache khi tạo thành công', async () => {
      const mockCreated: StudentRemark = {
        id: 2,
        studentId: 10,
        studentName: 'Lê Thị Bình',
        teacherId: 1,
        teacherName: 'Thầy A',
        strengths: 'Tiến bộ nhanh',
        createdAt: '2026-08-27',
        updatedAt: '2026-08-27',
      }
      vi.mocked(studentRemarkService.createRemark).mockResolvedValueOnce(mockCreated)

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateStudentRemark('MATH101', 10), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate({ strengths: 'Tiến bộ nhanh' })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(studentRemarkService.createRemark).toHaveBeenCalledWith('MATH101', 10, {
        strengths: 'Tiến bộ nhanh',
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['student-remarks', 'MATH101', 10],
      })
    })

    it('ném lỗi khi studentId là null', async () => {
      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useCreateStudentRemark('MATH101', null), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate({ strengths: 'Tiến bộ' })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe('Student ID is missing')
    })
  })

  describe('useDeleteStudentRemark', () => {
    it('gọi service deleteRemark và invalidate cache khi xóa thành công', async () => {
      vi.mocked(studentRemarkService.deleteRemark).mockResolvedValueOnce(undefined)

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useDeleteStudentRemark('MATH101', 10), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(5)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(studentRemarkService.deleteRemark).toHaveBeenCalledWith('MATH101', 10, 5)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['student-remarks', 'MATH101', 10],
      })
    })

    it('ném lỗi khi studentId là null', async () => {
      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useDeleteStudentRemark('MATH101', null), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(5)

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe('Student ID is missing')
    })
  })

  describe('useAiStudentRemarkEvaluation', () => {
    it('gọi service evaluateWithAi và invalidate credit cache khi thành công', async () => {
      const mockResult = {
        startDate: '2026-08-21',
        endDate: '2026-08-28',
        totalAssignments: 5,
        completedAssignments: 4,
        averageScore: 8.5,
        strengths: 'Tư duy tốt',
        weaknesses: 'Tính ẩu',
        generalAssessment: 'Hoàn thành 4/5 bài',
      }
      vi.mocked(studentRemarkService.evaluateWithAiAsync).mockResolvedValueOnce(mockResult as any)

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useAiStudentRemarkEvaluation('MATH101', 10), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate({ days: 7 })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(studentRemarkService.evaluateWithAiAsync).toHaveBeenCalledWith('MATH101', 10, { days: 7 })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user-credit-balance'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user-credit-transactions'] })
      expect(result.current.data).toEqual(mockResult)
    })
  })
})
