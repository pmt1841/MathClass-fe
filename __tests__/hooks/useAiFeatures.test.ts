import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAiFeatures } from '@/hooks/useAiFeatures'
import { aiFeatureService } from '@/services/aiFeatureService'

vi.mock('@/services/aiFeatureService', () => ({
  AI_FEATURE_TASKS: {
    SUBMISSION_GRADING: 'SUBMISSION_GRADING',
    STUDENT_HINT: 'STUDENT_HINT',
    QUESTION_GEN: 'QUESTION_GEN',
    BATCH_QUESTION_GEN: 'BATCH_QUESTION_GEN',
    CANVAS_LATEX: 'CANVAS_LATEX',
    STUDENT_REMARK: 'STUDENT_REMARK',
  },
  aiFeatureService: {
    getFeatures: vi.fn(),
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

describe('useAiFeatures hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lấy trạng thái các tính năng AI thành công từ server', async () => {
    const mockFeatures = {
      SUBMISSION_GRADING: true,
      STUDENT_HINT: false,
      QUESTION_GEN: true,
      BATCH_QUESTION_GEN: true,
      CANVAS_LATEX: false,
      STUDENT_REMARK: true,
    }
    vi.mocked(aiFeatureService.getFeatures).mockResolvedValueOnce(mockFeatures)

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useAiFeatures(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(aiFeatureService.getFeatures).toHaveBeenCalled()
    expect(result.current.data).toEqual(mockFeatures)
    expect(result.current.data?.SUBMISSION_GRADING).toBe(true)
    expect(result.current.data?.STUDENT_HINT).toBe(false)
  })

  it('xử lý khi API tính năng AI bị lỗi', async () => {
    vi.mocked(aiFeatureService.getFeatures).mockRejectedValue(
      new Error('Không thể tải cấu hình AI')
    )

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useAiFeatures(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true)
      },
      { timeout: 3500 }
    )

    expect(result.current.error?.message).toBe('Không thể tải cấu hình AI')
  })
})
