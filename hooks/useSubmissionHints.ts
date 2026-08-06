import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  submissionHintsService,
  SubmissionHintItemDTO,
  StudentHintResponse,
  HintHistoryResponse
} from '@/services/submissionHintsService'
import { handleApiError } from '@/lib/utils/error-handler'

export type { SubmissionHintItemDTO, StudentHintResponse, HintHistoryResponse }

export function useSubmissionHints(submissionId?: number | null) {
  const queryClient = useQueryClient()

  // 1. Fetch Hint History với React Query
  const historyQuery = useQuery<HintHistoryResponse>({
    queryKey: ['submission-hints', submissionId],
    queryFn: () => submissionHintsService.getHintHistory(submissionId!),
    enabled: typeof submissionId === 'number' && submissionId > 0,
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
    onSuccess: (newHint) => {
      // Invalidate & refetch lịch sử gợi ý sau khi tạo thành công
      if (submissionId) {
        queryClient.invalidateQueries({ queryKey: ['submission-hints', submissionId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['submission-hints'] })
      }
    },
  })

  const hints: SubmissionHintItemDTO[] = historyQuery.data?.hints || []
  const totalUsed: number = historyQuery.data?.totalUsed || 0
  const remainingHints: number = historyQuery.data?.remainingHints ?? 3

  const requestHint = async (assignmentId: number, currentContent: string): Promise<StudentHintResponse | null> => {
    try {
      const res = await requestHintMutation.mutateAsync({ assignmentId, currentContent })
      return res
    } catch (e: any) {
      return null
    }
  }

  const fetchHistory = (subId: number) => {
    if (subId && subId > 0) {
      queryClient.invalidateQueries({ queryKey: ['submission-hints', subId] })
    }
  }

  const errorMessage = historyQuery.error
    ? handleApiError(historyQuery.error, 'Không thể tải lịch sử gợi ý.')
    : requestHintMutation.error
      ? handleApiError(requestHintMutation.error, 'Không thể gửi yêu cầu gợi ý lúc này. Vui lòng thử lại sau.')
      : null

  return {
    hints,
    totalUsed,
    remainingHints,
    isLoading: historyQuery.isLoading,
    isRequesting: requestHintMutation.isPending,
    error: errorMessage,
    latestHint: requestHintMutation.data || null,
    fetchHistory,
    requestHint
  }
}
