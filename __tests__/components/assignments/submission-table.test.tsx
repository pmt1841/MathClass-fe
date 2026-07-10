import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SubmissionTable } from '@/components/assignments/submission-table'
import { submissionService } from '@/services/submissionService'

vi.mock('@/services/submissionService', () => ({
  submissionService: {
    getSubmissionsByAssignment: vi.fn(),
  },
}))

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

describe('SubmissionTable', () => {
  it('renders loading state initially', () => {
    vi.mocked(submissionService.getSubmissionsByAssignment).mockReturnValue(new Promise(() => {}))
    const queryClient = createQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <SubmissionTable assignmentId={1} />
      </QueryClientProvider>
    )

    expect(screen.getByPlaceholderText('Tìm kiếm tên học sinh...')).toBeInTheDocument()
  })

  it('renders table headers correctly', () => {
    vi.mocked(submissionService.getSubmissionsByAssignment).mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      last: true,
      size: 10,
      number: 0,
      pageable: {},
      sort: {},
      first: true,
      numberOfElements: 0,
      empty: true
    })
    
    const queryClient = createQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <SubmissionTable assignmentId={1} />
      </QueryClientProvider>
    )

    expect(screen.getByText('Tên học sinh')).toBeInTheDocument()
    expect(screen.getByText('Thời gian nộp')).toBeInTheDocument()
    expect(screen.getByText('Trạng thái')).toBeInTheDocument()
    expect(screen.getByText('Điểm')).toBeInTheDocument()
  })
})
