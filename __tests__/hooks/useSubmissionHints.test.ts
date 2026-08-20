import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useSubmissionHints } from '@/hooks/useSubmissionHints'
import { submissionHintsService } from '@/services/submissionHintsService'

vi.mock('@/services/submissionHintsService', () => ({
  submissionHintsService: {
    requestHint: vi.fn(),
    getHintHistory: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  )
}

describe('useSubmissionHints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(submissionHintsService.getHintHistory).mockResolvedValue({
      submissionId: 0,
      totalUsed: 0,
      maxHints: 3,
      remainingHints: 3,
      hints: [],
    })
  })

  it('khởi tạo với trạng thái rỗng khi submissionId là null/undefined', () => {
    const { result } = renderHook(() => useSubmissionHints(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.hints).toEqual([])
    expect(result.current.totalUsed).toBe(0)
    expect(result.current.remainingHints).toBe(3)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isRequesting).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.latestHint).toBeNull()
    expect(submissionHintsService.getHintHistory).not.toHaveBeenCalled()
  })

  it('tải lịch sử gợi ý khi có sẵn submissionId', async () => {
    const mockHistory = {
      submissionId: 100,
      totalUsed: 1,
      maxHints: 3,
      remainingHints: 2,
      hints: [
        {
          id: 1,
          hintNumber: 1,
          studentSnapshotContent: 'x^2 - 5x + 6 = 0',
          aiHintContent: 'Hãy tính Delta = b^2 - 4ac',
          createdAt: '2026-08-20T09:00:00Z',
        },
      ],
    }
    vi.mocked(submissionHintsService.getHintHistory).mockResolvedValueOnce(mockHistory)

    const { result } = renderHook(() => useSubmissionHints(100), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.hints).toHaveLength(1)
    })

    expect(result.current.hints[0].aiHintContent).toBe('Hãy tính Delta = b^2 - 4ac')
    expect(result.current.totalUsed).toBe(1)
    expect(result.current.remainingHints).toBe(2)
    expect(submissionHintsService.getHintHistory).toHaveBeenCalledWith(100)
  })

  it('khi submissionId ban đầu là null: xin gợi ý thành công -> cập nhật ngay cache, hiển thị gợi ý và gọi onSubmissionCreated', async () => {
    const onSubmissionCreated = vi.fn()
    const mockNewHint = {
      id: 10,
      submissionId: 42,
      hintNumber: 1,
      maxHints: 3,
      remainingHints: 2,
      hintContent: 'Gợi ý bước 1: Xác định điều kiện xác định của phương trình.',
      createdAt: '2026-08-20T09:10:00Z',
    }
    vi.mocked(submissionHintsService.requestHint).mockResolvedValueOnce(mockNewHint)

    const { result } = renderHook(
      () => useSubmissionHints(null, onSubmissionCreated),
      { wrapper: createWrapper() }
    )

    expect(result.current.hints).toEqual([])

    let response: any
    await act(async () => {
      response = await result.current.requestHint(15, 'Bài làm trống')
    })

    expect(response).toEqual(mockNewHint)
    expect(onSubmissionCreated).toHaveBeenCalledWith(42)

    // Xác nhận gợi ý mới xuất hiện ngay lập tức trong hints của hook
    expect(result.current.hints).toHaveLength(1)
    expect(result.current.hints[0].id).toBe(10)
    expect(result.current.hints[0].hintNumber).toBe(1)
    expect(result.current.hints[0].aiHintContent).toBe(
      'Gợi ý bước 1: Xác định điều kiện xác định của phương trình.'
    )
    expect(result.current.totalUsed).toBe(1)
    expect(result.current.remainingHints).toBe(2)
  })

  it('khi đã có gợi ý #1: xin tiếp gợi ý #2 -> danh sách hints chứa cả 2 gợi ý theo đúng thứ tự', async () => {
    const mockHistory1 = {
      submissionId: 42,
      totalUsed: 1,
      maxHints: 3,
      remainingHints: 2,
      hints: [
        {
          id: 10,
          hintNumber: 1,
          studentSnapshotContent: 'x >= 0',
          aiHintContent: 'Gợi ý 1',
          createdAt: '2026-08-20T09:10:00Z',
        },
      ],
    }
    const mockHistory2 = {
      submissionId: 42,
      totalUsed: 2,
      maxHints: 3,
      remainingHints: 1,
      hints: [
        {
          id: 10,
          hintNumber: 1,
          studentSnapshotContent: 'x >= 0',
          aiHintContent: 'Gợi ý 1',
          createdAt: '2026-08-20T09:10:00Z',
        },
        {
          id: 11,
          hintNumber: 2,
          studentSnapshotContent: 'x >= 0; sqrt(x) = 3',
          aiHintContent: 'Gợi ý 2: Bình phương 2 vế.',
          createdAt: '2026-08-20T09:12:00Z',
        },
      ],
    }
    vi.mocked(submissionHintsService.getHintHistory)
      .mockResolvedValueOnce(mockHistory1)
      .mockResolvedValue(mockHistory2)

    const mockHint2 = {
      id: 11,
      submissionId: 42,
      hintNumber: 2,
      maxHints: 3,
      remainingHints: 1,
      hintContent: 'Gợi ý 2: Bình phương 2 vế.',
      createdAt: '2026-08-20T09:12:00Z',
    }
    vi.mocked(submissionHintsService.requestHint).mockResolvedValueOnce(mockHint2)

    const { result } = renderHook(() => useSubmissionHints(42), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.hints).toHaveLength(1)
    })

    await act(async () => {
      await result.current.requestHint(15, 'x >= 0; sqrt(x) = 3')
    })

    await waitFor(() => {
      expect(result.current.hints).toHaveLength(2)
    })
    expect(result.current.hints[0].hintNumber).toBe(1)
    expect(result.current.hints[1].hintNumber).toBe(2)
    expect(result.current.hints[1].aiHintContent).toBe('Gợi ý 2: Bình phương 2 vế.')
    expect(result.current.totalUsed).toBe(2)
    expect(result.current.remainingHints).toBe(1)
  })

  it('xử lý lỗi khi gọi requestHint thất bại', async () => {
    const error = new Error('AI Provider 500 error')
    vi.mocked(submissionHintsService.requestHint).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useSubmissionHints(null), {
      wrapper: createWrapper(),
    })

    let response: any
    await act(async () => {
      response = await result.current.requestHint(15, '')
    })

    expect(response).toBeNull()
    await waitFor(() => {
      expect(result.current.error).toBe('AI Provider 500 error')
    })
    expect(result.current.hints).toEqual([])
  })
})
