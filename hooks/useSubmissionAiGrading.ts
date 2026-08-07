import { useMutation } from '@tanstack/react-query'
import {
  submissionAiGradingService,
  AiGradingResult
} from '@/services/submissionAiGradingService'
import { handleApiError } from '@/lib/utils/error-handler'

export type { AiGradingResult, DrawingIssue } from '@/services/submissionAiGradingService'

/**
 * MAT-250: Hook gọi AI chấm sơ bộ bài làm của học sinh.
 *
 * Pattern theo useSubmissionHints / useSubmissionComments:
 *   - gradeWithAi({ submissionId, assignmentId }) → chạy mutation
 *   - result: kết quả dự thảo (điểm + nhận xét + lỗi hình vẽ)
 *   - isGrading: trạng thái đang chạy AI
 *   - error: message lỗi đã xử lý qua handleApiError
 */
export function useSubmissionAiGrading() {
  const mutation = useMutation<AiGradingResult, Error, { submissionId: number; assignmentId: number }>({
    mutationFn: ({ submissionId, assignmentId }) =>
      submissionAiGradingService.submitAiGrading(submissionId, assignmentId),
  })

  const errorMessage = mutation.error
    ? handleApiError(mutation.error, 'AI tạm thời không thể chấm sơ bộ bài này. Vui lòng thử lại sau.')
    : null

  return {
    result: mutation.data || null,
    isGrading: mutation.isPending,
    error: errorMessage,
    gradeWithAi: mutation.mutateAsync,
    reset: mutation.reset,
  }
}
