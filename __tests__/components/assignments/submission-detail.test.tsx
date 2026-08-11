import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SubmissionDetail } from '@/components/assignments/submission-detail'
import { submissionService } from '@/services/submissionService'
import { assignmentService } from '@/services/assignmentService'
import { submissionAiGradingService } from '@/services/submissionAiGradingService'
import { aiFeatureService } from '@/services/aiFeatureService'

vi.mock('@/services/submissionService', () => ({
  submissionService: {
    getSubmissionById: vi.fn(),
    gradeSubmission: vi.fn(),
  },
}))

vi.mock('@/services/assignmentService', () => ({
  assignmentService: {
    getAssignmentById: vi.fn(),
  },
}))

vi.mock('@/services/submissionAiGradingService', () => ({
  submissionAiGradingService: {
    submitAiGrading: vi.fn(),
  },
}))

vi.mock('@/services/aiFeatureService', async () => {
  const actual = await vi.importActual<typeof import('@/services/aiFeatureService')>('@/services/aiFeatureService')
  return {
    ...actual,
    aiFeatureService: {
      getFeatures: vi.fn(),
    },
  }
})

// Mock ReactMarkdown since it can be problematic in jsdom
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: any }) => <div data-testid="markdown">{children}</div>,
}))

vi.mock('remark-math', () => ({ default: () => { } }))
vi.mock('remark-gfm', () => ({ default: () => { } }))
vi.mock('rehype-katex', () => ({ default: () => { } }))
vi.mock('katex/dist/katex.min.css', () => ({}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="jsxgraph-board" />,
}))

vi.mock('@/app/(dashboard)/assignments/[id]/_components/student-assignment-layout', () => ({
  extractDrawings: (content: string) => ({ content, extractedDrawings: [] }),
}))

vi.mock('@/components/ui/latex-toolbar', () => ({
  LatexToolbar: ({ onInsert }: any) => <div data-testid="latex-toolbar" />,
}))

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const mockAssignment = {
  id: 10,
  title: 'Bài tập kiểm tra',
  description: 'Mô tả đề bài',
  content: 'Nội dung đề bài',
  classroomId: 1,
  dueDate: '2026-07-01T00:00:00Z',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

const mockSubmission = {
  id: 100,
  assignmentId: 10,
  studentId: 1,
  studentName: 'Nguyen Van A',
  content: 'Hello World',
  teacherFeedback: 'Good job!',
  status: 'GRADED' as const,
  score: 9.5,
  submittedAt: '2026-06-15T10:00:00Z',
  updatedAt: '2026-06-15T10:00:00Z',
}

describe('SubmissionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.setItem('user_info', JSON.stringify({ role: 'TEACHER' }))
    // Mặc định: admin đã bật tính năng AI chấm sơ bộ
    vi.mocked(aiFeatureService.getFeatures).mockResolvedValue({
      ASSIGNMENT_GRADING: true,
      STUDENT_HINT: true,
      QUESTION_GEN: true,
      CANVAS_LATEX: true,
      ERROR_ANALYSIS: true,
    })
  })

  it('renders loading state initially', () => {
    vi.mocked(submissionService.getSubmissionById).mockReturnValue(new Promise(() => { }))
    vi.mocked(assignmentService.getAssignmentById).mockReturnValue(new Promise(() => { }))
    const queryClient = createQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SubmissionDetail submissionId={100} assignmentId={10} />
      </QueryClientProvider>
    )

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders submission details correctly', async () => {
    vi.mocked(submissionService.getSubmissionById).mockResolvedValue(mockSubmission)
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(mockAssignment)

    const queryClient = createQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SubmissionDetail submissionId={100} assignmentId={10} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
    })

    expect(screen.getByText('Hello World')).toBeInTheDocument()
    expect(screen.getByText('Đã chấm')).toBeInTheDocument()
  })

  it('renders error state correctly', async () => {
    vi.mocked(submissionService.getSubmissionById).mockRejectedValue(new Error('Network error'))
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(mockAssignment)

    const queryClient = createQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SubmissionDetail submissionId={100} assignmentId={10} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Lỗi khi tải chi tiết bài nộp/i)).toBeInTheDocument()
    })
  })

  it('renders grading form for submitted submissions', async () => {
    vi.mocked(submissionService.getSubmissionById).mockResolvedValue({
      ...mockSubmission,
      status: 'SUBMITTED',
      score: null,
      teacherFeedback: undefined,
    })
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(mockAssignment)

    const queryClient = createQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SubmissionDetail submissionId={100} assignmentId={10} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
    })

    // Grading form elements should be present
    expect(screen.getByText('Điểm:')).toBeInTheDocument()
    expect(screen.getByText(/Lưu điểm/)).toBeInTheDocument()
  })

  it('triggers AI grading and applies draft to the grade form', async () => {
    vi.mocked(submissionService.getSubmissionById).mockResolvedValue({
      ...mockSubmission,
      status: 'SUBMITTED',
      score: null,
      teacherFeedback: undefined,
    })
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(mockAssignment)

    const aiResult = {
      suggestedScore: 8.5,
      draftFeedback: 'Nhận xét từ AI',
      drawingIssues: [{ issue: 'Thiếu đường cao AH', detail: 'Cần kẻ AH vuông góc BC' }],
    }
    vi.mocked(submissionAiGradingService.submitAiGrading).mockResolvedValue(aiResult)

    const queryClient = createQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SubmissionDetail submissionId={100} assignmentId={10} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
    })

    // Nút "AI chấm sơ bộ" hiển thị cho giáo viên
    const aiButton = screen.getByRole('button', { name: /AI chấm sơ bộ/i })
    expect(aiButton).toBeInTheDocument()
    fireEvent.click(aiButton)

    // Chờ kết quả AI hiển thị trong panel
    await waitFor(() => {
      expect(screen.getByText('Thiếu đường cao AH')).toBeInTheDocument()
    })
    expect(screen.getByText('Nhận xét từ AI')).toBeInTheDocument()

    // Áp dụng dự thảo AI vào form chấm điểm
    fireEvent.click(screen.getByRole('button', { name: /Dùng điểm & nhận xét này/i }))

    await waitFor(() => {
      const scoreInput = screen.getByRole('spinbutton')
      expect(scoreInput).toHaveValue(8.5)
    })
  })

  it('hides AI grading button when admin has not enabled the feature', async () => {
    vi.mocked(submissionService.getSubmissionById).mockResolvedValue({
      ...mockSubmission,
      status: 'SUBMITTED',
      score: null,
      teacherFeedback: undefined,
    })
    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(mockAssignment)
    // Admin chưa bật tính năng AI chấm sơ bộ
    vi.mocked(aiFeatureService.getFeatures).mockResolvedValue({
      ASSIGNMENT_GRADING: false,
      STUDENT_HINT: false,
      QUESTION_GEN: false,
      CANVAS_LATEX: false,
      ERROR_ANALYSIS: false,
    })

    const queryClient = createQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SubmissionDetail submissionId={100} assignmentId={10} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
    })

    // Nút "AI chấm sơ bộ" KHÔNG hiển thị khi tính năng chưa được bật
    expect(screen.queryByRole('button', { name: /AI chấm sơ bộ/i })).not.toBeInTheDocument()
  })
})
