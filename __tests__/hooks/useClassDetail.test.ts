import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useClassDetail,
  useUpdateClassroom,
  useDeleteClassroom,
  useClassStudents,
  useClassAssignments,
  useAddStudent,
  useRemoveStudent,
} from '@/hooks/useClassDetail'
import { classroomService } from '@/services/classroomService'
import { assignmentService } from '@/services/assignmentService'
import { ClassroomDetail } from '@/types'

vi.mock('@/services/classroomService', () => ({
  classroomService: {
    getClassroomDetail: vi.fn(),
    updateClassroom: vi.fn(),
    deleteClassroom: vi.fn(),
    getClassroomStudents: vi.fn(),
    getClassroomAssignments: vi.fn(),
    addStudent: vi.fn(),
    removeStudent: vi.fn(),
  },
}))

vi.mock('@/services/assignmentService', () => ({
  assignmentService: {
    getAssignmentSheets: vi.fn(),
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

describe('useClassDetail hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useClassDetail', () => {
    it('gọi classroomService.getClassroomDetail và trả về chi tiết lớp học', async () => {
      const mockDetail: ClassroomDetail = {
        id: 1,
        classCode: 'MATH101',
        className: 'Toán nâng cao 10A1',
        description: 'Lớp chuyên Toán',
        teacherId: 2,
        teacherName: 'Thầy Nguyễn Văn A',
        studentCount: 35,
        maxStudents: 40,
      }
      vi.mocked(classroomService.getClassroomDetail).mockResolvedValueOnce(mockDetail)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useClassDetail('MATH101'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(classroomService.getClassroomDetail).toHaveBeenCalledWith('MATH101')
      expect(result.current.data).toEqual(mockDetail)
    })
  })

  describe('useUpdateClassroom', () => {
    it('cập nhật thông tin lớp học và invalidate cache', async () => {
      vi.mocked(classroomService.updateClassroom).mockResolvedValueOnce({} as any)

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateClassroom('MATH101'), {
        wrapper: createWrapper(queryClient),
      })

      await act(async () => {
        await result.current.mutateAsync({
          className: 'Toán chuyên 10A1',
          description: 'Cập nhật mô tả',
          maxStudents: 45,
        })
      })

      expect(classroomService.updateClassroom).toHaveBeenCalledWith('MATH101', {
        className: 'Toán chuyên 10A1',
        description: 'Cập nhật mô tả',
        maxStudents: 45,
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['classroom', 'MATH101'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-classrooms'] })
    })
  })

  describe('useDeleteClassroom', () => {
    it('xóa lớp học và invalidate cache my-classrooms', async () => {
      vi.mocked(classroomService.deleteClassroom).mockResolvedValueOnce(undefined)

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useDeleteClassroom(), {
        wrapper: createWrapper(queryClient),
      })

      await act(async () => {
        await result.current.mutateAsync('MATH101')
      })

      expect(classroomService.deleteClassroom).toHaveBeenCalledWith('MATH101')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-classrooms'] })
    })
  })

  describe('useClassStudents', () => {
    it('gọi classroomService.getClassroomStudents với phân trang và từ khóa tìm kiếm', async () => {
      const mockStudentsData = {
        content: [
          { id: 10, fullName: 'Lê Thị Bình', email: 'binh@example.com' },
        ],
        totalPages: 1,
        totalElements: 1,
      }
      vi.mocked(classroomService.getClassroomStudents).mockResolvedValueOnce(mockStudentsData as any)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(
        () => useClassStudents('MATH101', 0, 10, 's.fullName,asc', 'Bình'),
        { wrapper: createWrapper(queryClient) }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(classroomService.getClassroomStudents).toHaveBeenCalledWith('MATH101', {
        page: 0,
        size: 10,
        sort: 's.fullName,asc',
        keyword: 'Bình',
      })
      expect(result.current.data?.content).toHaveLength(1)
      expect(result.current.data?.totalElements).toBe(1)
    })
  })

  describe('useClassAssignments', () => {
    it('activeTab individual: gọi classroomService.getClassroomAssignments', async () => {
      const mockData = {
        content: [
          { id: 101, title: 'Bài tập 1: Phương trình bậc 2', status: 'PUBLISHED' },
        ],
        totalPages: 1,
        totalElements: 1,
      }
      vi.mocked(classroomService.getClassroomAssignments).mockResolvedValueOnce(mockData as any)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(
        () =>
          useClassAssignments('MATH101', 'individual', {
            page: 0,
            size: 10,
            keyword: 'Phương trình',
          }),
        { wrapper: createWrapper(queryClient) }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(classroomService.getClassroomAssignments).toHaveBeenCalledWith('MATH101', {
        page: 0,
        size: 10,
        status: 'PUBLISHED',
        keyword: 'Phương trình',
      })
      expect(result.current.data?.content).toHaveLength(1)
    })

    it('activeTab sheet: gọi assignmentService.getAssignmentSheets và đánh dấu isSheet: true', async () => {
      const mockSheets = {
        content: [
          { id: 201, title: 'Phiếu ôn tập chương 1' },
        ],
        totalPages: 1,
        totalElements: 1,
      }
      vi.mocked(assignmentService.getAssignmentSheets).mockResolvedValueOnce(mockSheets as any)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(
        () =>
          useClassAssignments('MATH101', 'sheet', {
            page: 0,
            size: 10,
          }),
        { wrapper: createWrapper(queryClient) }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(assignmentService.getAssignmentSheets).toHaveBeenCalledWith(
        expect.objectContaining({
          classCode: 'MATH101',
          status: 'PUBLISHED',
        })
      )
      expect(result.current.data?.content[0]).toHaveProperty('isSheet', true)
    })
  })

  describe('useAddStudent & useRemoveStudent', () => {
    it('useAddStudent - thêm học sinh bằng email và invalidate các query liên quan', async () => {
      vi.mocked(classroomService.addStudent).mockResolvedValueOnce({} as any)

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useAddStudent('MATH101'), {
        wrapper: createWrapper(queryClient),
      })

      await act(async () => {
        await result.current.mutateAsync('student@example.com')
      })

      expect(classroomService.addStudent).toHaveBeenCalledWith('MATH101', 'student@example.com')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['classroom-students', 'MATH101'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['classroom', 'MATH101'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['teacher-stats'] })
    })

    it('useRemoveStudent - xóa học sinh khỏi lớp và invalidate các query liên quan', async () => {
      vi.mocked(classroomService.removeStudent).mockResolvedValueOnce(undefined)

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useRemoveStudent('MATH101'), {
        wrapper: createWrapper(queryClient),
      })

      await act(async () => {
        await result.current.mutateAsync(5)
      })

      expect(classroomService.removeStudent).toHaveBeenCalledWith('MATH101', 5)
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['classroom-students', 'MATH101'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['classroom', 'MATH101'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['teacher-stats'] })
    })
  })
})
