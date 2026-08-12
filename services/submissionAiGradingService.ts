import api from '@/lib/axios'

/**
 * MAT-250: AI chấm sơ bộ bài làm của học sinh cho giáo viên.
 *
 * Backend đọc đề bài (assignment.content — gồm cả hình vẽ Canvas mẫu `[SHAPE_x]`)
 * và bài nộp của học sinh (submission.content — gồm cả hình vẽ Canvas của học sinh),
 * đối chiếu hình vẽ, chấm sơ bộ bài tự luận rồi trả về:
 *   - Điểm số dự kiến (suggestedScore, thang 0-10)
 *   - Dự thảo lời nhận xét (draftFeedback, hỗ trợ Markdown + LaTeX)
 *   - Danh sách lỗi hình vẽ phát hiện (drawingIssues)
 *
 * Kết quả chỉ là DỰ THẢO — backend KHÔNG tự ghi vào score/teacherFeedback.
 * Giáo viên có toàn quyền chỉnh sửa trước khi nhấn "Lưu/Xác nhận" (gradeSubmission).
 */

export interface DrawingIssue {
  /** Loại lỗi, ví dụ: "Thiếu đường cao AH", "Sai góc tại đỉnh B" */
  issue: string
  /** Chi tiết lỗi, giải thích thêm (có thể rỗng) */
  detail: string
}

export interface AiGradingResult {
  /** Điểm số dự kiến của AI (0-10) */
  suggestedScore: number
  /** Dự thảo lời nhận xét (Markdown + LaTeX) */
  draftFeedback: string
  /** Danh sách lỗi hình vẽ Canvas phát hiện (rỗng nếu không có lỗi) */
  drawingIssues: DrawingIssue[]
  /**
   * Bài tập có hình vẽ Canvas mẫu để đối chiếu hay không.
   * - true  → AI đã đối chiếu hình vẽ học sinh với hình mẫu.
   * - false → Bài tập không có hình mẫu, AI chỉ chấm phần tự luận.
   * - undefined → Backend không trả về (mặc định coi là có đối chiếu).
   */
  hasCanvasComparison?: boolean
}

export const submissionAiGradingService = {
  /**
   * Gọi backend chạy AI chấm sơ bộ cho 1 bài nộp.
   * @param submissionId ID bài nộp của học sinh
   * @param assignmentId ID bài tập (để backend lấy hình mẫu + maxScore)
   * @param options Cấu hình thêm (như AbortSignal để hủy request)
   */
  submitAiGrading: async (
    submissionId: number,
    assignmentId: number,
    options?: { signal?: AbortSignal }
  ): Promise<AiGradingResult> => {
    const res = await api.post<AiGradingResult>(
      `/submissions/${submissionId}/ai-grading`,
      { assignmentId },
      { signal: options?.signal }
    )
    return res.data
  }
}
