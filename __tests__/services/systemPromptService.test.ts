import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { systemPromptService } from '@/services/systemPromptService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('systemPromptService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAllPrompts gọi API GET /system-prompts và trả về danh sách prompts', async () => {
    const mockPrompts = [
      {
        id: 1,
        code: 'PROMPT_SOLVE_HINT',
        name: 'Prompt Gợi ý giải toán',
        taskCode: 'HINT_EXPLANATION',
        defaultContent: 'Content...',
        currentContent: 'Content...',
        allowedVariables: ['subject', 'grade_level'],
        status: 'ACTIVE',
      },
    ]
    ;(api.get as any).mockResolvedValue({ data: { data: mockPrompts } })

    const result = await systemPromptService.getAllPrompts({ taskCode: 'HINT_EXPLANATION' })

    expect(api.get).toHaveBeenCalledWith('/system-prompts', {
      params: { taskCode: 'HINT_EXPLANATION' },
    })
    expect(result).toEqual(mockPrompts)
  })

  it('createPrompt gọi API POST /system-prompts với dữ liệu hợp lệ', async () => {
    const newPromptData = {
      code: 'PROMPT_TEST',
      name: 'Prompt Test',
      taskCode: 'HINT_EXPLANATION',
      defaultContent: 'Test {{var}}',
      allowedVariables: ['var'],
    }
    const mockCreated = { id: 2, ...newPromptData, currentContent: 'Test {{var}}', status: 'ACTIVE' }
    ;(api.post as any).mockResolvedValue({ data: mockCreated })

    const result = await systemPromptService.createPrompt(newPromptData)

    expect(api.post).toHaveBeenCalledWith('/system-prompts', newPromptData)
    expect(result).toEqual(mockCreated)
  })

  it('resetToDefault gọi API POST /system-prompts/{id}/reset', async () => {
    const mockResetResponse = { id: 1, code: 'PROMPT_SOLVE_HINT', currentContent: 'Default content' }
    ;(api.post as any).mockResolvedValue({ data: mockResetResponse })

    const result = await systemPromptService.resetToDefault(1, 'Reason reset')

    expect(api.post).toHaveBeenCalledWith('/system-prompts/1/reset', { reason: 'Reason reset' })
    expect(result).toEqual(mockResetResponse)
  })

  it('renderPrompt gọi API POST /system-prompts/render', async () => {
    const renderReq = { promptCode: 'PROMPT_SOLVE_HINT', variables: { subject: 'Toán' } }
    const mockRenderRes = { promptCode: 'PROMPT_SOLVE_HINT', renderedPrompt: 'Rendered...', usedVariables: ['subject'] }
    ;(api.post as any).mockResolvedValue({ data: mockRenderRes })

    const result = await systemPromptService.renderPrompt(renderReq)

    expect(api.post).toHaveBeenCalledWith('/system-prompts/render', renderReq)
    expect(result).toEqual(mockRenderRes)
  })
})
