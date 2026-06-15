import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SubmissionDetail } from '@/components/assignments/submission-detail'
import { submissionApi } from '@/lib/api/submission'

vi.mock('@/lib/api/submission', () => ({
  submissionApi: {
    getSubmissionById: vi.fn(),
  },
}))

// Mock ReactMarkdown since it can be problematic in jsdom
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: any }) => <div data-testid="markdown">{children}</div>,
}))

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

describe('SubmissionDetail', () => {
  it('renders loading state initially', () => {
    vi.mocked(submissionApi.getSubmissionById).mockReturnValue(new Promise(() => {}))
    const queryClient = createQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <SubmissionDetail submissionId={100} />
      </QueryClientProvider>
    )

    // Using querySelector to find Skeleton class if no specific text
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders submission details correctly', async () => {
    vi.mocked(submissionApi.getSubmissionById).mockResolvedValue({
      id: 100,
      assignmentId: 10,
      studentId: 1,
      studentName: 'Nguyen Van A',
      content: 'Hello World',
      teacherFeedback: 'Good job!',
      status: 'GRADED',
      score: 9.5,
      submittedAt: '2026-06-15T10:00:00Z',
      updatedAt: '2026-06-15T10:00:00Z'
    })
    
    const queryClient = createQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <SubmissionDetail submissionId={100} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
    })

    expect(screen.getByText('Hello World')).toBeInTheDocument()
    expect(screen.getByText('Good job!')).toBeInTheDocument()
    expect(screen.getByText('Điểm: 9.5/10')).toBeInTheDocument()
    expect(screen.getByText('Đã chấm')).toBeInTheDocument()
  })

  it('renders error state correctly', async () => {
    vi.mocked(submissionApi.getSubmissionById).mockRejectedValue(new Error('Network error'))
    
    const queryClient = createQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <SubmissionDetail submissionId={100} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Lỗi khi tải chi tiết bài nộp/i)).toBeInTheDocument()
    })
  })
})
