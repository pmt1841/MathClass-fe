/** Nhãn tiếng Việt cho các task AI trên bảng giá credit. */
export const CREDIT_TASK_LABELS: Record<string, string> = {
  STUDENT_HINT: 'Gợi ý tư duy làm bài',
  CANVAS_LATEX: 'Trợ lý AI Canvas (Chữ viết tay & Phác thảo)',
  QUESTION_GEN: 'Sinh đề',
  SUBMISSION_GRADING: 'Chấm bài tự động',
  ERROR_ANALYSIS: 'Phân tích lỗi sai',
}

export function getCreditTaskLabel(task: string): string {
  return CREDIT_TASK_LABELS[task] || task
}
