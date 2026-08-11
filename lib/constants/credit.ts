/** Nhãn tiếng Việt cho các task AI trên bảng giá credit. */
export const CREDIT_TASK_LABELS: Record<string, string> = {
  STUDENT_HINT: 'Gợi ý tư duy làm bài',
  CANVAS_LATEX: 'Chuyển ảnh chữ viết tay → LaTeX',
  QUESTION_GEN: 'Sinh đề',
  ASSIGNMENT_GRADING: 'Chấm bài tự động',
  ERROR_ANALYSIS: 'Phân tích lỗi sai',
}

export function getCreditTaskLabel(task: string): string {
  return CREDIT_TASK_LABELS[task] || task
}
