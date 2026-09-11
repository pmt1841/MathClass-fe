import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMyClassrooms } from '@/hooks/useClassrooms'
import { classroomService, Classroom } from '@/services/classroomService'

vi.mock('@/services/classroomService', () => ({
  classroomService: {
    getMyClassrooms: vi.fn(),
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

describe('useMyClassrooms hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lấy danh sách lớp học của tôi thành công', async () => {
    const mockClassrooms: Classroom[] = [
      {
        id: 1,
        classCode: 'MATH101',
        className: 'Toán 10 Chuyên',
        teacherId: 10,
        teacherName: 'Thầy Bình',
        studentCount: 25,
        maxStudents: 30,
      },
      {
        id: 2,
        classCode: 'MATH102',
        className: 'Toán 11 Cơ Bản',
        teacherId: 10,
        teacherName: 'Thầy Bình',
        studentCount: 28,
        maxStudents: 35,
      },
    ]
    vi.mocked(classroomService.getMyClassrooms).mockResolvedValueOnce(mockClassrooms)

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useMyClassrooms(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(classroomService.getMyClassrooms).toHaveBeenCalled()
    expect(result.current.data).toEqual(mockClassrooms)
    expect(result.current.data?.length).toBe(2)
  })

  it('xử lý khi API trả về lỗi', async () => {
    vi.mocked(classroomService.getMyClassrooms).mockRejectedValueOnce(
      new Error('Lỗi kết nối máy chủ')
    )

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useMyClassrooms(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Lỗi kết nối máy chủ')
  })
})
