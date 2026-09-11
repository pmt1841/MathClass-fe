import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { aiFeatureService, AI_FEATURE_TASKS } from '@/services/aiFeatureService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('aiFeatureService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('định nghĩa đúng các hằng số nhiệm vụ AI_FEATURE_TASKS', () => {
    expect(AI_FEATURE_TASKS.SUBMISSION_GRADING).toBe('SUBMISSION_GRADING')
    expect(AI_FEATURE_TASKS.STUDENT_HINT).toBe('STUDENT_HINT')
    expect(AI_FEATURE_TASKS.QUESTION_GEN).toBe('QUESTION_GEN')
    expect(AI_FEATURE_TASKS.BATCH_QUESTION_GEN).toBe('BATCH_QUESTION_GEN')
    expect(AI_FEATURE_TASKS.CANVAS_LATEX).toBe('CANVAS_LATEX')
    expect(AI_FEATURE_TASKS.STUDENT_REMARK).toBe('STUDENT_REMARK')
  })

  it('getFeatures - gọi GET /ai/features và trả về dictionary map taskCode -> enabled', async () => {
    const mockFeatures: Record<string, boolean> = {
      SUBMISSION_GRADING: true,
      STUDENT_HINT: false,
      QUESTION_GEN: true,
      BATCH_QUESTION_GEN: true,
      CANVAS_LATEX: false,
      STUDENT_REMARK: true,
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockFeatures })

    const result = await aiFeatureService.getFeatures()

    expect(api.get).toHaveBeenCalledWith('/ai/features')
    expect(result).toEqual(mockFeatures)
    expect(result.SUBMISSION_GRADING).toBe(true)
    expect(result.STUDENT_HINT).toBe(false)
  })
})
