import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StudentAssignmentLayout } from '@/app/(dashboard)/assignments/[id]/_components/student-assignment-layout'

// ── Biến điều khiển feature flag STUDENT_HINT (thay đổi giữa các test) ────────
let studentHintEnabled = true

vi.mock('@/hooks/useAiFeatures', () => ({
  AI_FEATURE_TASKS: {
    ASSIGNMENT_GRADING: 'ASSIGNMENT_GRADING',
    STUDENT_HINT: 'STUDENT_HINT',
    QUESTION_GEN: 'QUESTION_GEN',
    CANVAS_LATEX: 'CANVAS_LATEX',
    CONTENT_SUMMARIZATION: 'CONTENT_SUMMARIZATION',
    ERROR_ANALYSIS: 'ERROR_ANALYSIS',
  },
  useAiFeatures: () => ({
    data: {
      ASSIGNMENT_GRADING: true,
      STUDENT_HINT: studentHintEnabled,
      QUESTION_GEN: true,
      CANVAS_LATEX: true,
      CONTENT_SUMMARIZATION: true,
      ERROR_ANALYSIS: true,
    },
  }),
}))

vi.mock('@/hooks/useSubmissionHints', () => ({
  useSubmissionHints: () => ({
    hints: [],
    totalUsed: 0,
    remainingHints: 3,
    isLoading: false,
    isRequesting: false,
    error: null,
    latestHint: null,
    fetchHistory: vi.fn(),
    requestHint: vi.fn(),
  }),
}))

vi.mock('@/hooks/useSubmissionComments', () => ({
  useSubmissionComments: () => ({
    comments: [],
    isLoading: false,
    error: null,
    addComment: vi.fn(),
    isAdding: false,
    deleteComment: vi.fn(),
    isDeleting: false,
  }),
}))

vi.mock('@/hooks/use-text-editor', () => ({
  useTextEditor: () => ({ handleFormatText: vi.fn(), handleInsertLatex: vi.fn() }),
}))

// ── Mock các thư viện UI nặng / không cần thiết trong jsdom ──────────────────
vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div data-testid="markdown">{children}</div>,
}))
vi.mock('remark-math', () => ({ default: () => { } }))
vi.mock('remark-gfm', () => ({ default: () => { } }))
vi.mock('rehype-katex', () => ({ default: () => { } }))
vi.mock('rehype-raw', () => ({ default: () => { } }))
vi.mock('rehype-sanitize', () => ({ default: () => { } }))
vi.mock('katex/dist/katex.min.css', () => ({}))
vi.mock('@/lib/markdown', () => ({ sanitizeSchema: {} }))
vi.mock('@/lib/rehype-mark-comments', () => ({ default: () => { } }))
vi.mock('@/components/ui/markdown-components', () => ({ markdownComponents: {} }))

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="jsxgraph-dynamic" />,
}))
vi.mock('@/components/ui/latex-toolbar', () => ({
  LatexToolbar: () => <div data-testid="latex-toolbar" />,
}))
vi.mock('./countdown-timer', () => ({
  CountdownTimer: () => <div data-testid="countdown-timer" />,
}))
vi.mock('react-resizable-panels', () => ({
  PanelGroup: ({ children }: any) => <div data-testid="panel-group">{children}</div>,
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  PanelResizeHandle: () => <div data-testid="panel-resize-handle" />,
}))

// Radix UI mock đơn giản
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}))
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}))

const createQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const defaultProps = {
  assignment: {
    id: 10,
    title: 'Bài tập kiểm tra',
    description: 'Mô tả đề bài',
    content: 'Nội dung đề bài',
    deadline: '2099-01-01T00:00:00Z',
    images: [],
    sheetSiblings: [],
  },
  submissionId: 100,
  submissionContent: '',
  setSubmissionContent: vi.fn(),
  isReadOnly: false,
  isSavingExternal: false,
  lastSavedExternal: null,
  onSaveDraft: vi.fn(),
  onSubmit: vi.fn(),
  onUnsubmit: vi.fn(),
  submissionStatus: 'DRAFT' as const,
  submissionScore: null,
  teacherFeedback: '',
  onBack: vi.fn(),
  fromText: 'Lớp học',
  onAutoSave: vi.fn(async () => { }),
}

const renderLayout = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <StudentAssignmentLayout {...defaultProps} />
    </QueryClientProvider>
  )

describe('StudentAssignmentLayout — MAT-254 Feature Flags (STUDENT_HINT)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    studentHintEnabled = true
  })

  it('hiển thị nút "Cần gợi ý" khi admin đã bật task STUDENT_HINT', () => {
    renderLayout()
    expect(screen.getByRole('button', { name: /Cần gợi ý/i })).toBeInTheDocument()
  })

  it('ẩn nút "Cần gợi ý" khi admin tắt task STUDENT_HINT', () => {
    studentHintEnabled = false
    renderLayout()
    expect(screen.queryByRole('button', { name: /Cần gợi ý/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Gợi ý AI/i })).not.toBeInTheDocument()
  })
})
