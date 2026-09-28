export const CREDIT_TASK_LABELS: Record<string, string> = {
  STUDENT_HINT: 'Gợi ý tư duy làm bài',
  CANVAS_LATEX: 'Trợ lý AI Canvas (Chữ viết tay & Phác thảo)',
  QUESTION_GEN: 'Sinh đề',
  BATCH_QUESTION_GEN: 'AI tách đề',
  SUBMISSION_GRADING: 'Chấm bài tự động',
  STUDENT_REMARK: 'AI Đánh giá & Nhận xét học sinh',
}

export function getCreditTaskLabel(task: string): string {
  return CREDIT_TASK_LABELS[task] || task
}

/**
 * Format nội dung mô tả giao dịch credit sang tiếng Việt:
 * Tự động chuyển đổi các mã task code (QUESTION_GEN, STUDENT_HINT, CANVAS_LATEX, ...)
 * thành tên tiếng Việt thân thiện, dễ hiểu.
 */
export function formatCreditTransactionDescription(
  description?: string | null,
  task?: string | null
): string {
  if (description) {
    let result = description
    for (const [taskKey, taskLabel] of Object.entries(CREDIT_TASK_LABELS)) {
      if (result.includes(taskKey)) {
        result = result.replaceAll(taskKey, `"${taskLabel}"`)
      }
    }
    // Bỏ định dạng (#id) hoặc (đơn #id) theo yêu cầu giao diện người dùng
    result = result.replace(/\s*\((?:đơn\s*)?#\d+\)/gi, '')
    result = result.replace(/\s*đơn\s*#\d+/gi, '')
    return result.trim()
  }
  if (task) {
    return `Tác vụ "${getCreditTaskLabel(task)}"`
  }
  return '—'
}
