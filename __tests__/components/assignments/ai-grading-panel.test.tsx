import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AiGradingPanel } from '@/components/assignments/ai-grading-panel'
import { AiGradingResult } from '@/services/submissionAiGradingService'

// Mock ReactMarkdown since it can be problematic in jsdom
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: any }) => <div data-testid="markdown">{children}</div>,
}))

vi.mock('remark-math', () => ({ default: () => { } }))
vi.mock('remark-gfm', () => ({ default: () => { } }))
vi.mock('rehype-katex', () => ({ default: () => { } }))
vi.mock('katex/dist/katex.min.css', () => ({}))

vi.mock('@/components/ui/markdown-components', () => ({
  markdownComponents: {},
}))

const makeProps = (overrides: Partial<React.ComponentProps<typeof AiGradingPanel>> = {}) => ({
  open: true,
  isGrading: false,
  error: null,
  result: null,
  studentName: 'Nguyen Van A',
  maxScore: 10,
  onClose: vi.fn(),
  onRetry: vi.fn(),
  onUseDraft: vi.fn(),
  ...overrides,
})

describe('AiGradingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    render(<AiGradingPanel {...makeProps({ open: false })} />)
    expect(screen.queryByText(/AI chấm sơ bộ/)).not.toBeInTheDocument()
  })

  it('shows loading state while AI is grading', () => {
    render(<AiGradingPanel {...makeProps({ isGrading: true })} />)
    expect(screen.getByText(/AI đang đối chiếu hình vẽ Canvas/)).toBeInTheDocument()
  })

  it('shows error message and triggers retry', () => {
    const onRetry = vi.fn()
    render(<AiGradingPanel {...makeProps({ error: 'AI lỗi rồi', onRetry })} />)
    expect(screen.getByText('AI lỗi rồi')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders result: drawing issues, suggested score and draft feedback', () => {
    const onUseDraft = vi.fn()
    const result: AiGradingResult = {
      suggestedScore: 8,
      draftFeedback: '**Làm tốt!**',
      drawingIssues: [{ issue: 'Thiếu đường cao AH', detail: 'Cần kẻ AH vuông góc BC' }],
    }
    render(<AiGradingPanel {...makeProps({ result, onUseDraft })} />)

    expect(screen.getByText('Thiếu đường cao AH')).toBeInTheDocument()
    expect(screen.getByText('Cần kẻ AH vuông góc BC')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('**Làm tốt!**')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Dùng điểm & nhận xét này/i }))
    expect(onUseDraft).toHaveBeenCalledWith(result)
  })

  it('shows matched drawing message when no issues found', () => {
    const result: AiGradingResult = {
      suggestedScore: 9,
      draftFeedback: 'OK',
      drawingIssues: [],
      hasCanvasComparison: true,
    }
    render(<AiGradingPanel {...makeProps({ result })} />)
    expect(screen.getByText(/Hình vẽ khớp với hình mẫu/)).toBeInTheDocument()
  })

  it('shows no-canvas note when assignment has no sample drawing', () => {
    const result: AiGradingResult = {
      suggestedScore: 7,
      draftFeedback: 'OK',
      drawingIssues: [],
      hasCanvasComparison: false,
    }
    render(<AiGradingPanel {...makeProps({ result })} />)
    expect(screen.getByText(/không có hình vẽ Canvas mẫu/)).toBeInTheDocument()
  })
})
