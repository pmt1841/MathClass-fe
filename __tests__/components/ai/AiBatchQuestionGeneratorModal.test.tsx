import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AiBatchQuestionGeneratorModal } from '@/components/ai/AiBatchQuestionGeneratorModal'
import { aiBatchQuestionService } from '@/services/aiBatchQuestionService'
import { assignmentService } from '@/services/assignmentService'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/aiBatchQuestionService', () => ({
  aiBatchQuestionService: {
    batchGenerateQuestions: vi.fn(),
  },
}))

vi.mock('@/services/assignmentService', () => ({
  assignmentService: {
    createBatchAssignments: vi.fn(),
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

describe('AiBatchQuestionGeneratorModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('không render gì khi isOpen = false', () => {
    const { container } = render(
      <AiBatchQuestionGeneratorModal isOpen={false} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('render giao diện bước 1 khi mở modal', () => {
    render(
      <AiBatchQuestionGeneratorModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Tạo Hàng Loạt Bài Tập Từ File (AI Tách Đề)')).toBeInTheDocument()
    expect(screen.getByText('2 Credits / lượt')).toBeInTheDocument()
    expect(screen.getByText(/Kéo thả hoặc Nhấp để chọn file Word \/ PDF đề thi/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tách bài tập bằng AI/i })).toBeInTheDocument()
  })

  it('gọi API tách đề và chuyển sang bước 2 hiển thị danh sách bài tập nháp', async () => {
    const mockBatchResult = {
      suggestedTitle: 'Đề kiểm tra đại số 9',
      questions: [
        {
          id: 'q1',
          title: 'Bài 1: Giải phương trình',
          content: 'Giải phương trình $x^2 - 4 = 0$',
        },
        {
          id: 'q2',
          title: 'Bài 2: Rút gọn',
          content: 'Rút gọn biểu thức $A = \\sqrt{9}$',
        },
      ],
      totalQuestions: 2,
    }

    vi.mocked(aiBatchQuestionService.batchGenerateQuestions).mockResolvedValue(mockBatchResult as any)

    render(
      <AiBatchQuestionGeneratorModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const textarea = screen.getByPlaceholderText(/Dán toàn bộ nội dung đề bài/i)
    fireEvent.change(textarea, { target: { value: 'Bài 1: Giải phương trình... Bài 2: Rút gọn...' } })

    const generateBtn = screen.getByRole('button', { name: /Tách bài tập bằng AI/i })
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(screen.getByText(/Đã tách thành 2 bài tập độc lập/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue('Bài 1: Giải phương trình')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Bài 2: Rút gọn')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Lưu tất cả \(2 bài tập nháp\) vào Kho/i })).toBeInTheDocument()
  })

  it('cho phép lưu tất cả các bài tập vào Kho', async () => {
    const mockBatchResult = {
      suggestedTitle: 'Đề kiểm tra',
      questions: [
        {
          id: 'q1',
          title: 'Bài 1: Rút gọn biểu thức',
          content: 'Rút gọn $x + 1 = 2$',
        },
      ],
      totalQuestions: 1,
    }

    vi.mocked(aiBatchQuestionService.batchGenerateQuestions).mockResolvedValue(mockBatchResult as any)
    vi.mocked(assignmentService.createBatchAssignments).mockResolvedValue([] as any)

    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(
      <AiBatchQuestionGeneratorModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />,
      { wrapper: createWrapper() }
    )

    const textarea = screen.getByPlaceholderText(/Dán toàn bộ nội dung đề bài/i)
    fireEvent.change(textarea, { target: { value: 'Bài 1: Rút gọn biểu thức...' } })

    const generateBtn = screen.getByRole('button', { name: /Tách bài tập bằng AI/i })
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Lưu tất cả \(1 bài tập nháp\) vào Kho/i })).toBeInTheDocument()
    })

    const saveBtn = screen.getByRole('button', { name: /Lưu tất cả \(1 bài tập nháp\) vào Kho/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(assignmentService.createBatchAssignments).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'Bài 1: Rút gọn biểu thức',
          content: 'Rút gọn $x + 1 = 2$',
          allowResubmit: true,
        }),
      ])
      expect(onSuccess).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })
})
