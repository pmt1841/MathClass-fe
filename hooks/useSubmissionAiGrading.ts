import { useMutation } from '@tanstack/react-query'
import {
  submissionAiGradingService,
  AiGradingResult
} from '@/services/submissionAiGradingService'
import { handleApiError, isInsufficientCredit } from '@/lib/utils/error-handler'

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

  // MAT-255: người dùng hết credit AI → FE hiển thị CTA "Mua thêm credit"
  const insufficientCredit = isInsufficientCredit(mutation.error)

  return {
    result: mutation.data || null,
    isGrading: mutation.isPending,
    error: errorMessage,
    insufficientCredit,
    gradeWithAi: mutation.mutateAsync,
    reset: mutation.reset,
  }
}
