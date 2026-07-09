import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SubmissionDetail } from '@/components/assignments/submission-detail'
import { submissionApi } from '@/lib/api/submission'
import { assignmentApi } from '@/lib/api/assignment'

vi.mock('@/lib/api/submission', () => ({
  submissionApi: {
    getSubmissionById: vi.fn(),
    gradeSubmission: vi.fn(),
  },
}))

vi.mock('@/lib/api/assignment', () => ({
  assignmentApi: {
    getAssignmentById: vi.fn(),
  },
}))

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
  })

  it('renders loading state initially', () => {
    vi.mocked(submissionApi.getSubmissionById).mockReturnValue(new Promise(() => { }))
    vi.mocked(assignmentApi.getAssignmentById).mockReturnValue(new Promise(() => { }))
    const queryClient = createQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SubmissionDetail submissionId={100} assignmentId={10} />
      </QueryClientProvider>
    )

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders submission details correctly', async () => {
    vi.mocked(submissionApi.getSubmissionById).mockResolvedValue(mockSubmission)
    vi.mocked(assignmentApi.getAssignmentById).mockResolvedValue(mockAssignment)

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
    vi.mocked(submissionApi.getSubmissionById).mockRejectedValue(new Error('Network error'))
    vi.mocked(assignmentApi.getAssignmentById).mockResolvedValue(mockAssignment)

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
    vi.mocked(submissionApi.getSubmissionById).mockResolvedValue({
      ...mockSubmission,
      status: 'SUBMITTED',
      score: null,
      teacherFeedback: undefined,
    })
    vi.mocked(assignmentApi.getAssignmentById).mockResolvedValue(mockAssignment)

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
})
