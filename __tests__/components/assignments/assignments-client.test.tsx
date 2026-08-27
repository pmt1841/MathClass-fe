import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AssignmentsPageClient } from '@/app/(dashboard)/assignments/_components/assignments-client'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'TEACHER', email: 'teacher@codegym.com' },
    hasPermission: () => true,
  }),
}))

vi.mock('@/components/ui/with-permission', () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/hooks/useAssignments', () => ({
  useAssignments: () => ({
    data: { content: [], totalPages: 0, totalElements: 0 },
    isLoading: false,
    error: null,
  }),
  useDeleteAssignment: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/hooks/useClassrooms', () => ({
  useMyClassrooms: () => ({
    classrooms: [],
    isLoading: false,
  }),
}))

vi.mock('@/services/assignmentService', () => ({
  assignmentService: {
    getAssignmentsForCurrentUser: vi.fn().mockResolvedValue({ content: [], totalPages: 0 }),
    getAllAssignmentTags: vi.fn().mockResolvedValue([]),
    getTags: vi.fn().mockResolvedValue([]),
    getPublicAssignments: vi.fn().mockResolvedValue({ content: [], totalPages: 0 }),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('AssignmentsPageClient — Batch AI Generation Trigger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hiển thị nút "Tạo hàng loạt bằng AI" cho giáo viên và mở Modal khi click', () => {
    render(<AssignmentsPageClient />, { wrapper: createWrapper() })

    const batchAiBtn = screen.getByRole('button', { name: /Tạo hàng loạt bằng AI/i })
    expect(batchAiBtn).toBeInTheDocument()

    fireEvent.click(batchAiBtn)

    expect(screen.getByText('Tạo Hàng Loạt Bài Tập Từ File (AI Tách Đề)')).toBeInTheDocument()
    expect(screen.getByText(/Kéo thả hoặc Nhấp để chọn file Word \/ PDF đề thi/i)).toBeInTheDocument()
  })
})
