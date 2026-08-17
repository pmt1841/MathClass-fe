import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SystemPromptTab } from '@/components/admin/ai-config/SystemPromptTab'
import { systemPromptService } from '@/services/systemPromptService'

vi.mock('@/services/systemPromptService', () => ({
  systemPromptService: {
    getAllPrompts: vi.fn(),
    updatePrompt: vi.fn(),
    resetToDefault: vi.fn(),
    getPromptHistory: vi.fn(),
    rollbackToVersion: vi.fn(),
    renderPrompt: vi.fn(),
    testExecutePrompt: vi.fn(),
  },
}))


vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('SystemPromptTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hiển thị danh sách System Prompt cards từ API', async () => {
    const mockPrompts = [
      {
        id: 1,
        code: 'PROMPT_SOLVE_HINT',
        name: 'Prompt Gợi ý giải toán từng bước',
        taskCode: 'HINT_EXPLANATION',
        defaultContent: 'Default content...',
        currentContent: 'Current content...',
        allowedVariables: ['subject', 'grade_level'],
        status: 'ACTIVE',
      },
    ]
    ;(systemPromptService.getAllPrompts as any).mockResolvedValue(mockPrompts)

    render(<SystemPromptTab />)

    await waitFor(() => {
      expect(screen.getByText('Prompt Gợi ý giải toán từng bước')).toBeInTheDocument()
    })
  })

  it('hiển thị thông báo khi danh sách prompt rỗng', async () => {
    ;(systemPromptService.getAllPrompts as any).mockResolvedValue([])

    render(<SystemPromptTab />)

    await waitFor(() => {
      expect(screen.getByText('Chưa có System Prompt nào')).toBeInTheDocument()
    })
  })
})
