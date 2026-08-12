'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  submissionAiGradingService,
  AiGradingResult,
} from '@/services/submissionAiGradingService'

export interface UseAiGradingWithBackgroundReturn {
  isPanelOpen: boolean
  isConfirmOpen: boolean
  isGrading: boolean
  isMinimized: boolean
  result: AiGradingResult | null
  error: string | null
  insufficientCredit: boolean
  triggerAiGrading: (
    submissionId: number,
    assignmentId: number,
    studentName: string
  ) => Promise<void>
  handleCloseRequest: () => void
  handleMinimize: () => void
  handleCancelGrading: () => void
  handleContinueViewing: () => void
  openPanelManually: () => void
  closePanelManually: () => void
}

/**
 * Hook quản lý tiến trình AI Chấm sơ bộ với khả năng chạy ngầm và hủy tiến trình.
 */
export function useAiGradingWithBackground(): UseAiGradingWithBackgroundReturn {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [result, setResult] = useState<AiGradingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [insufficientCredit, setInsufficientCredit] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isMinimizedRef = useRef(false)

  // Cleanup abort controller when unmounting
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const triggerAiGrading = useCallback(
    async (submissionId: number, assignmentId: number, studentName: string) => {
      // Abort any existing ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      setError(null)
      setResult(null)
      setInsufficientCredit(false)
      setIsMinimized(false)
      isMinimizedRef.current = false
      setIsPanelOpen(true)
      setIsConfirmOpen(false)
      setIsGrading(true)

      try {
        const data = await submissionAiGradingService.submitAiGrading(
          submissionId,
          assignmentId,
          { signal: controller.signal }
        )

        setResult(data)
        setIsGrading(false)

        if (isMinimizedRef.current) {
          toast.success(`AI đã chấm sơ bộ xong bài làm của ${studentName || 'học sinh'}!`, {
            action: {
              label: 'Xem kết quả',
              onClick: () => {
                setIsPanelOpen(true)
                setIsMinimized(false)
                isMinimizedRef.current = false
              },
            },
            duration: 8000,
          })
        }
      } catch (err: any) {
        // Ignore intentional abort cancellations
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          return
        }

        const isCreditErr =
          err?.response?.status === 402 ||
          err?.response?.data?.message?.includes('credit') ||
          err?.message?.includes('credit')

        setInsufficientCredit(Boolean(isCreditErr))
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          'Có lỗi xảy ra khi gọi AI chấm bài.'

        setError(errorMessage)
        setIsGrading(false)

        if (isMinimizedRef.current) {
          toast.error(`Không thể hoàn tất AI chấm bài: ${errorMessage}`)
        }
      }
    },
    []
  )

  const handleCloseRequest = useCallback(() => {
    if (isGrading) {
      setIsConfirmOpen(true)
    } else {
      setIsPanelOpen(false)
      setIsMinimized(false)
      isMinimizedRef.current = false
    }
  }, [isGrading])

  const handleMinimize = useCallback(() => {
    isMinimizedRef.current = true
    setIsMinimized(true)
    setIsPanelOpen(false)
    setIsConfirmOpen(false)
    toast.info('Đã ẩn cửa sổ. AI đang tiếp tục chấm bài ngầm...', {
      duration: 3500,
    })
  }, [])

  const handleCancelGrading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGrading(false)
    setIsPanelOpen(false)
    setIsConfirmOpen(false)
    setIsMinimized(false)
    isMinimizedRef.current = false
    setResult(null)
    setError(null)
    toast('Đã hủy tiến trình AI chấm bài.')
  }, [])

  const handleContinueViewing = useCallback(() => {
    setIsConfirmOpen(false)
  }, [])

  const openPanelManually = useCallback(() => {
    setIsPanelOpen(true)
    setIsMinimized(false)
    isMinimizedRef.current = false
  }, [])

  const closePanelManually = useCallback(() => {
    handleCloseRequest()
  }, [handleCloseRequest])

  return {
    isPanelOpen,
    isConfirmOpen,
    isGrading,
    isMinimized,
    result,
    error,
    insufficientCredit,
    triggerAiGrading,
    handleCloseRequest,
    handleMinimize,
    handleCancelGrading,
    handleContinueViewing,
    openPanelManually,
    closePanelManually,
  }
}
