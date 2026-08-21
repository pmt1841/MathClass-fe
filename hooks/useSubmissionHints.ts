import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  submissionHintsService,
  SubmissionHintItemDTO,
  StudentHintResponse,
  HintHistoryResponse
} from '@/services/submissionHintsService'
import { handleApiError, isInsufficientCredit } from '@/lib/utils/error-handler'

export type { SubmissionHintItemDTO, StudentHintResponse, HintHistoryResponse }

export function useSubmissionHints(
  submissionId?: number | null,
  onSubmissionCreated?: (createdSubmissionId: number) => void
) {
  const queryClient = useQueryClient()
  const [activeSubmissionId, setActiveSubmissionId] = useState<number | null>(
    submissionId || null
  )

  useEffect(() => {
    if (submissionId) {
      setActiveSubmissionId(submissionId)
    }
  }, [submissionId])

  // 1. Fetch Hint History với React Query
  const historyQuery = useQuery<HintHistoryResponse>({
    queryKey: ['submission-hints', activeSubmissionId],
    queryFn: () => submissionHintsService.getHintHistory(activeSubmissionId!),
    enabled: typeof activeSubmissionId === 'number' && activeSubmissionId > 0,
    staleTime: 1000 * 60 * 5, // 5 phút cache
  })

  // 2. Mutation cho yêu cầu gợi ý mới
  const requestHintMutation = useMutation<
    StudentHintResponse,
    Error,
    { assignmentId: number; currentContent: string }
  >({
    mutationFn: ({ assignmentId, currentContent }) =>
      submissionHintsService.requestHint(assignmentId, currentContent),
    onSuccess: (newHint, variables) => {
      const targetSubId = newHint.submissionId || activeSubmissionId
      if (targetSubId) {
        if (targetSubId !== activeSubmissionId) {
          setActiveSubmissionId(targetSubId)
        }
        if (onSubmissionCreated) {
          onSubmissionCreated(targetSubId)
        }

        // Cập nhật ngay lập tức Query Cache để hiển thị phản hồi/gợi ý AI
        queryClient.setQueryData<HintHistoryResponse>(
          ['submission-hints', targetSubId],
          (old) => {
            const newItem: SubmissionHintItemDTO = {
              id: newHint.id,
              hintNumber: newHint.hintNumber,
              studentSnapshotContent: variables.currentContent,
              aiHintContent: newHint.hintContent,
              createdAt: newHint.createdAt,
            }
            const existing = old?.hints || []
            const filtered = existing.filter(
              (h) => h.id !== newHint.id && h.hintNumber !== newHint.hintNumber
            )
            const updatedHints = [...filtered, newItem].sort(
              (a, b) => a.hintNumber - b.hintNumber
            )
            return {
              submissionId: targetSubId,
              totalUsed: updatedHints.length,
              maxHints: newHint.maxHints || 3,
              remainingHints: newHint.remainingHints,
              hints: updatedHints,
            }
          }
        )

        queryClient.invalidateQueries({ queryKey: ['submission-hints', targetSubId] })
      }
    },
  })

  const hints: SubmissionHintItemDTO[] = historyQuery.data?.hints || []
  const totalUsed: number = historyQuery.data?.totalUsed || 0
  const remainingHints: number = historyQuery.data?.remainingHints ?? 3

  const requestHint = async (
    assignmentId: number,
    currentContent: string
  ): Promise<StudentHintResponse | null> => {
    try {
      const res = await requestHintMutation.mutateAsync({ assignmentId, currentContent })
      return res
    } catch (e: any) {
      return null
    }
  }

  const fetchHistory = (subId: number) => {
    if (subId && subId > 0) {
      setActiveSubmissionId(subId)
      queryClient.invalidateQueries({ queryKey: ['submission-hints', subId] })
    }
  }

  const errorMessage = historyQuery.error
    ? handleApiError(historyQuery.error, 'Không thể tải lịch sử gợi ý.')
    : requestHintMutation.error
      ? handleApiError(requestHintMutation.error, 'Không thể gửi yêu cầu gợi ý lúc này. Vui lòng thử lại sau.')
      : null

  // MAT-255: người dùng hết credit AI → FE hiển thị CTA "Mua thêm credit"
  const insufficientCredit = isInsufficientCredit(requestHintMutation.error)

  return {
    hints,
    totalUsed,
    remainingHints,
    isLoading: historyQuery.isLoading,
    isRequesting: requestHintMutation.isPending,
    error: errorMessage,
    insufficientCredit,
    latestHint: requestHintMutation.data || null,
    fetchHistory,
    requestHint,
  }
}
