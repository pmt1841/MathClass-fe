export const CREDIT_TASK_LABELS: Record<string, string> = {
  STUDENT_HINT: 'Gợi ý tư duy làm bài',
  CANVAS_LATEX: 'Trợ lý AI Canvas (Chữ viết tay & Phác thảo)',
  QUESTION_GEN: 'Sinh đề',
  BATCH_QUESTION_GEN: 'AI tách đề',
  SUBMISSION_GRADING: 'Chấm bài tự động',
  STUDENT_REMARK: 'AI Đánh giá & Nhận xét học sinh',
}

export function getCreditTaskLabel(
  task: string,
  t?: (key: string, variables?: Record<string, string | number>) => string
): string {
  if (t) {
    const key = `creditTasks.${task}`
    const translated = t(key)
    if (translated && translated !== key) return translated
  }
  return CREDIT_TASK_LABELS[task] || task
}

/**
 * Format nội dung mô tả giao dịch credit:
 * Tự động chuyển đổi các mã task code (QUESTION_GEN, STUDENT_HINT, CANVAS_LATEX, ...)
 * thành tên hiển thị đa ngôn ngữ.
 */
export function formatCreditTransactionDescription(
  description?: string | null,
  task?: string | null,
  t?: (key: string, variables?: Record<string, string | number>) => string
): string {
  if (description) {
    let result = description
    for (const [taskKey] of Object.entries(CREDIT_TASK_LABELS)) {
      if (result.includes(taskKey)) {
        const label = getCreditTaskLabel(taskKey, t)
        result = result.replaceAll(taskKey, `"${label}"`)
      }
    }
    // Bỏ định dạng (#id) hoặc (đơn #id) theo yêu cầu giao diện người dùng
    result = result.replace(/\s*\((?:đơn\s*)?#\d+\)/gi, '')
    result = result.replace(/\s*đơn\s*#\d+/gi, '')
    return result.trim()
  }
  if (task) {
    const taskName = getCreditTaskLabel(task, t)
    return t ? t('Tác vụ "{task}"', { task: taskName }) : `Tác vụ "${taskName}"`
  }
  return '—'
}

