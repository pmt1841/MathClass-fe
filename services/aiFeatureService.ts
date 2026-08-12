import api from '@/lib/axios'

/**
 * Trạng thái bật/tắt các tính năng AI cho giao diện người dùng.
 * FE dùng để ẩn/hiện các nút tính năng AI dựa trên cấu hình của Admin
 * (ví dụ: ẩn nút "AI chấm sơ bộ" khi admin chưa bật task SUBMISSION_GRADING).
 */
export const AI_FEATURE_TASKS = {
  SUBMISSION_GRADING: 'SUBMISSION_GRADING',
  STUDENT_HINT: 'STUDENT_HINT',
  QUESTION_GEN: 'QUESTION_GEN',
  CANVAS_LATEX: 'CANVAS_LATEX',
  HANDWRITING_LATEX: 'HANDWRITING_LATEX',
  SKETCH_GEOMETRY: 'SKETCH_GEOMETRY',
  ERROR_ANALYSIS: 'ERROR_ANALYSIS',
} as const

export type AiFeatureTask = (typeof AI_FEATURE_TASKS)[keyof typeof AI_FEATURE_TASKS]

export const aiFeatureService = {
  /**
   * Lấy map taskCode -> enabled.
   * enabled = true khi admin đã cấu hình task, bật cờ enabled và provider ACTIVE.
   */
  getFeatures: async (): Promise<Record<AiFeatureTask, boolean>> => {
    const res = await api.get<Record<AiFeatureTask, boolean>>('/ai/features')
    return res.data
  }
}
