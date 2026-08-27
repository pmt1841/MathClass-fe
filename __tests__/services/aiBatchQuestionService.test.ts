import { describe, it, expect, vi, beforeEach } from 'vitest'
import axiosInstance from '@/lib/axios'
import { aiBatchQuestionService } from '@/services/aiBatchQuestionService'

vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('aiBatchQuestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gọi đúng endpoint /ai/batch-generate-questions với textContent và FormData', async () => {
    const mockResponseData = {
      suggestedTitle: 'Đề kiểm tra 15 phút',
      questions: [
        {
          id: 'q1',
          title: 'Bài 1: Giải phương trình',
          content: 'Giải phương trình $x + 1 = 2$',
        },
      ],
      totalQuestions: 1,
    }

    vi.mocked(axiosInstance.post).mockResolvedValue({ data: mockResponseData } as any)

    const result = await aiBatchQuestionService.batchGenerateQuestions({
      textContent: 'Bài 1: Giải phương trình x + 1 = 2',
      includeExplanation: false,
    })

    expect(axiosInstance.post).toHaveBeenCalledWith(
      '/ai/batch-generate-questions',
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    )

    expect(result).toEqual(mockResponseData)
    expect(result.totalQuestions).toBe(1)
  })

  it('gọi API kèm file đính kèm thành công', async () => {
    const mockFile = new File(['dummy content'], 'de-thi.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    const mockResponseData = {
      suggestedTitle: 'Đề thi Word',
      questions: [],
      totalQuestions: 0,
    }

    vi.mocked(axiosInstance.post).mockResolvedValue({ data: mockResponseData } as any)

    const result = await aiBatchQuestionService.batchGenerateQuestions({
      file: mockFile,
    })

    expect(axiosInstance.post).toHaveBeenCalledTimes(1)
    expect(result.suggestedTitle).toBe('Đề thi Word')
  })
})
