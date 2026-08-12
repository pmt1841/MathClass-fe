import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSubmissionAiGrading } from '@/hooks/useSubmissionAiGrading'
import { submissionAiGradingService } from '@/services/submissionAiGradingService'

import { creditService } from '@/services/creditService'

vi.mock('@/services/submissionAiGradingService', () => ({
  submissionAiGradingService: {
    submitAiGrading: vi.fn(),
  },
}))

vi.mock('@/services/creditService', () => ({
  creditService: {
    refundTask: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

describe('useSubmissionAiGrading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default closed state', () => {
    const { result } = renderHook(() => useSubmissionAiGrading())

    expect(result.current.isPanelOpen).toBe(false)
    expect(result.current.isConfirmOpen).toBe(false)
    expect(result.current.isGrading).toBe(false)
    expect(result.current.isMinimized).toBe(false)
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('opens panel and sets grading state when calling gradeWithAi', async () => {
    const mockResult = {
      suggestedScore: 9,
      draftFeedback: 'Tuyệt vời',
      drawingIssues: [],
    }
    vi.mocked(submissionAiGradingService.submitAiGrading).mockResolvedValueOnce(mockResult)

    const { result } = renderHook(() => useSubmissionAiGrading())

    act(() => {
      result.current.gradeWithAi({ submissionId: 1, assignmentId: 10, studentName: 'Học sinh A' })
    })

    expect(result.current.isPanelOpen).toBe(true)
    expect(result.current.isGrading).toBe(true)

    await waitFor(() => {
      expect(result.current.isGrading).toBe(false)
    })

    expect(result.current.result).toEqual(mockResult)
  })

  it('opens confirm dialog when handleCloseRequest is called while isGrading is true', async () => {
    vi.mocked(submissionAiGradingService.submitAiGrading).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    )

    const { result } = renderHook(() => useSubmissionAiGrading())

    act(() => {
      result.current.gradeWithAi({ submissionId: 1, assignmentId: 10 })
    })

    expect(result.current.isGrading).toBe(true)

    act(() => {
      result.current.handleCloseRequest()
    })

    expect(result.current.isConfirmOpen).toBe(true)
  })

  it('minimizes panel when handleMinimize is called', () => {
    const { result } = renderHook(() => useSubmissionAiGrading())

    act(() => {
      result.current.handleMinimize()
    })

    expect(result.current.isMinimized).toBe(true)
    expect(result.current.isPanelOpen).toBe(false)
    expect(result.current.isConfirmOpen).toBe(false)
  })

  it('opens confirm dialog if calling gradeWithAi again while AI is currently grading in background', () => {
    vi.mocked(submissionAiGradingService.submitAiGrading).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    )

    const { result } = renderHook(() => useSubmissionAiGrading())

    act(() => {
      result.current.gradeWithAi({ submissionId: 1, assignmentId: 10 })
    })

    // Simulate user minimizing panel
    act(() => {
      result.current.handleMinimize()
    })

    expect(result.current.isPanelOpen).toBe(false)
    expect(result.current.isMinimized).toBe(true)

    // User clicks "AI chấm sơ bộ" button again
    act(() => {
      result.current.gradeWithAi({ submissionId: 1, assignmentId: 10 })
    })

    // Should open Popup B (isConfirmOpen = true)
    expect(result.current.isConfirmOpen).toBe(true)
  })

  it('opens Popup A when calling handleContinueViewing from Popup B', () => {
    const { result } = renderHook(() => useSubmissionAiGrading())

    act(() => {
      result.current.handleContinueViewing()
    })

    expect(result.current.isConfirmOpen).toBe(false)
    expect(result.current.isPanelOpen).toBe(true)
    expect(result.current.isMinimized).toBe(false)
  })

  it('resets state and aborts request when handleCancelGrading is called', () => {
    const { result } = renderHook(() => useSubmissionAiGrading())

    act(() => {
      result.current.handleCancelGrading()
    })

    expect(result.current.isGrading).toBe(false)
    expect(result.current.isPanelOpen).toBe(false)
    expect(result.current.isConfirmOpen).toBe(false)
    expect(result.current.result).toBeNull()
  })
})
