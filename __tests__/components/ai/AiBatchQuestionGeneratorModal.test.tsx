import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toast } from 'sonner'
import { AiBatchQuestionGeneratorModal } from '@/components/ai/AiBatchQuestionGeneratorModal'
import { aiBatchQuestionService } from '@/services/aiBatchQuestionService'
import { aiJobService } from '@/services/aiJobService'
import { assignmentService } from '@/services/assignmentService'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/services/aiJobService', () => ({
  aiJobService: {
    getJobStatus: vi.fn(),
    cancelJob: vi.fn(),
  },
}))

vi.mock('@/services/aiBatchQuestionService', () => ({
  aiBatchQuestionService: {
    batchGenerateQuestions: vi.fn(),
    batchGenerateQuestionsAsync: vi.fn(),
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
    vi.mocked(aiBatchQuestionService.batchGenerateQuestionsAsync).mockImplementation((params) =>
      aiBatchQuestionService.batchGenerateQuestions(params)
    )
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

  it('chặn file vượt quá dung lượng cho phép (> 15MB) và hiển thị toast lỗi', () => {
    render(
      <AiBatchQuestionGeneratorModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const largeFile = new File(['a'.repeat(16 * 1024 * 1024)], 'large-exam.pdf', { type: 'application/pdf' })
    Object.defineProperty(largeFile, 'size', { value: 16 * 1024 * 1024 })

    fireEvent.change(fileInput, { target: { files: [largeFile] } })

    expect(toast.error).toHaveBeenCalledWith('Dung lượng file tối đa là 15MB')
  })

  it('cho phép chỉnh sửa tiêu đề bài tập con ở Bước 2', async () => {
    const mockBatchResult = {
      suggestedTitle: 'Đề kiểm tra',
      questions: [
        {
          id: 'q1',
          title: 'Tiêu đề cũ',
          content: 'Giải phương trình $x = 1$',
        },
      ],
      totalQuestions: 1,
    }

    vi.mocked(aiBatchQuestionService.batchGenerateQuestions).mockResolvedValue(mockBatchResult as any)
    vi.mocked(assignmentService.createBatchAssignments).mockResolvedValue([] as any)

    render(
      <AiBatchQuestionGeneratorModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const textarea = screen.getByPlaceholderText(/Dán toàn bộ nội dung đề bài/i)
    fireEvent.change(textarea, { target: { value: 'Bài 1...' } })

    const generateBtn = screen.getByRole('button', { name: /Tách bài tập bằng AI/i })
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tiêu đề cũ')).toBeInTheDocument()
    })

    const titleInput = screen.getByDisplayValue('Tiêu đề cũ')
    fireEvent.change(titleInput, { target: { value: 'Tiêu đề đã sửa mới' } })

    expect(screen.getByDisplayValue('Tiêu đề đã sửa mới')).toBeInTheDocument()

    const saveBtn = screen.getByRole('button', { name: /Lưu tất cả/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(assignmentService.createBatchAssignments).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'Tiêu đề đã sửa mới',
        }),
      ])
    })
  })

  it('cho phép xóa bài tập con khỏi danh sách khi click icon Thùng rác', async () => {
    const mockBatchResult = {
      suggestedTitle: 'Đề kiểm tra',
      questions: [
        { id: 'q1', title: 'Bài 1', content: 'Nội dung 1' },
        { id: 'q2', title: 'Bài 2', content: 'Nội dung 2' },
      ],
      totalQuestions: 2,
    }

    vi.mocked(aiBatchQuestionService.batchGenerateQuestions).mockResolvedValue(mockBatchResult as any)

    render(
      <AiBatchQuestionGeneratorModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const textarea = screen.getByPlaceholderText(/Dán toàn bộ nội dung đề bài/i)
    fireEvent.change(textarea, { target: { value: 'Đề...' } })

    fireEvent.click(screen.getByRole('button', { name: /Tách bài tập bằng AI/i }))

    await waitFor(() => {
      expect(screen.getByText(/Đã tách thành 2 bài tập độc lập/i)).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle(/Xóa bài tập này khỏi danh sách/i)
    fireEvent.click(deleteButtons[0])

    expect(toast.info).toHaveBeenCalledWith('Đã xóa bài tập khỏi danh sách tạo')
    expect(screen.getByText(/Đã tách thành 1 bài tập độc lập/i)).toBeInTheDocument()
  })

  it('quay lại Bước 1 khi click nút "Đổi file khác"', async () => {
    const mockBatchResult = {
      suggestedTitle: 'Đề kiểm tra',
      questions: [{ id: 'q1', title: 'Bài 1', content: 'Nội dung 1' }],
      totalQuestions: 1,
    }

    vi.mocked(aiBatchQuestionService.batchGenerateQuestions).mockResolvedValue(mockBatchResult as any)

    render(
      <AiBatchQuestionGeneratorModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const textarea = screen.getByPlaceholderText(/Dán toàn bộ nội dung đề bài/i)
    fireEvent.change(textarea, { target: { value: 'Đề bài...' } })

    fireEvent.click(screen.getByRole('button', { name: /Tách bài tập bằng AI/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Đổi file khác/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Đổi file khác/i }))

    expect(screen.getByText(/Kéo thả hoặc Nhấp để chọn file Word \/ PDF đề thi/i)).toBeInTheDocument()
  })

  it('hiển thị thông báo toast lỗi thân thiện khi AI gặp lỗi quota 429 hoặc bảo trì', async () => {
    vi.mocked(aiBatchQuestionService.batchGenerateQuestions).mockRejectedValue({
      response: { data: { message: 'Resource exhausted (quota 429)' } },
    })

    render(
      <AiBatchQuestionGeneratorModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const textarea = screen.getByPlaceholderText(/Dán toàn bộ nội dung đề bài/i)
    fireEvent.change(textarea, { target: { value: 'Nội dung...' } })

    fireEvent.click(screen.getByRole('button', { name: /Tách bài tập bằng AI/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Hệ thống AI đang bảo trì hoặc hết hạn ngạch. Vui lòng thử lại sau!')
    })
  })

  it('chỉ đính kèm ảnh có mã xuất hiện trong nội dung bài tập tương ứng', async () => {
    const mockBatchResult = {
      suggestedTitle: 'Đề thi hình học',
      questions: [
        { id: 'q1', title: 'Bài 1', content: 'Xem hình [IMAGE_1] và tính diện tích' },
        { id: 'q2', title: 'Bài 2', content: 'Giải phương trình đại số không có hình' },
      ],
      extractedImages: [
        { imageCode: '[IMAGE_1]', imageUrl: 'https://cdn.example.com/img1.png' },
        { imageCode: '[IMAGE_2]', imageUrl: 'https://cdn.example.com/img2.png' },
      ],
      totalQuestions: 2,
    }

    vi.mocked(aiBatchQuestionService.batchGenerateQuestions).mockResolvedValue(mockBatchResult as any)
    vi.mocked(assignmentService.createBatchAssignments).mockResolvedValue([] as any)

    render(
      <AiBatchQuestionGeneratorModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const textarea = screen.getByPlaceholderText(/Dán toàn bộ nội dung đề bài/i)
    fireEvent.change(textarea, { target: { value: 'Nội dung...' } })

    fireEvent.click(screen.getByRole('button', { name: /Tách bài tập bằng AI/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Lưu tất cả/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Lưu tất cả/i }))

    await waitFor(() => {
      expect(assignmentService.createBatchAssignments).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'Bài 1',
          content: 'Xem hình [IMAGE_1] và tính diện tích',
          images: [{ imageCode: '[IMAGE_1]', imageUrl: 'https://cdn.example.com/img1.png' }],
        }),
        expect.objectContaining({
          title: 'Bài 2',
          content: 'Giải phương trình đại số không có hình',
          images: [],
        }),
      ])
    })
  })

  it('tiếp tục chạy ngầm không bị abort khi người dùng đóng modal trong lúc đang xử lý', async () => {
    let capturedSignal: AbortSignal | undefined
    let resolvePromise: (value: any) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    vi.mocked(aiBatchQuestionService.batchGenerateQuestionsAsync).mockImplementation(
      async (_params, options) => {
        capturedSignal = options?.signal
        return pendingPromise as any
      }
    )

    const onCloseMock = vi.fn()
    const { rerender } = render(
      <AiBatchQuestionGeneratorModal isOpen={true} onClose={onCloseMock} />,
      { wrapper: createWrapper() }
    )

    const textarea = screen.getByPlaceholderText(/Dán toàn bộ nội dung đề bài/i)
    fireEvent.change(textarea, { target: { value: 'Nội dung đề bài kiểm tra...' } })

    fireEvent.click(screen.getByRole('button', { name: /Tách bài tập bằng AI/i }))

    // Kiểm tra đã bắt đầu gọi API và signal chưa bị abort
    expect(capturedSignal).toBeDefined()
    expect(capturedSignal?.aborted).toBe(false)

    // Đóng modal bằng cách chuyển isOpen = false
    rerender(<AiBatchQuestionGeneratorModal isOpen={false} onClose={onCloseMock} />)

    // Signal vẫn không bị abort!
    expect(capturedSignal?.aborted).toBe(false)

    // Trả về kết quả hoàn tất trong khi modal đang đóng
    resolvePromise!({
      suggestedTitle: 'Đề hoàn thành ngầm',
      questions: [{ id: 'q1', title: 'Bài 1 ngầm', content: 'Nội dung 1' }],
      totalQuestions: 1,
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('AI đã tách xong 1 bài tập!')
      )
    })
  })

  it('hủy tác vụ khi người dùng click nút "Dừng tác vụ" và xác nhận trong dialog', async () => {
    let capturedSignal: AbortSignal | undefined
    vi.mocked(aiBatchQuestionService.batchGenerateQuestionsAsync).mockImplementation(
      async (_params, options) => {
        capturedSignal = options?.signal
        await options?.onJobCreated?.('job-test-cancel')
        return new Promise(() => { }) // pending mãi
      }
    )
    vi.mocked(aiJobService.getJobStatus).mockResolvedValue({
      jobId: 'job-test-cancel',
      taskCode: 'BATCH_QUESTION_GEN',
      status: 'QUEUED',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    })
    vi.mocked(aiJobService.cancelJob).mockResolvedValue({
      jobId: 'job-test-cancel',
      status: 'CANCELLED',
      cancelled: true,
      refunded: true,
      refundedCredits: 5,
      code: 'SUCCESS',
      message: 'Đã hủy tác vụ trong hàng chờ và hoàn lại 5 credit.',
    })

    render(
      <AiBatchQuestionGeneratorModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const textarea = screen.getByPlaceholderText(/Dán toàn bộ nội dung đề bài/i)
    fireEvent.change(textarea, { target: { value: 'Đề bài...' } })

    fireEvent.click(screen.getByRole('button', { name: /Tách bài tập bằng AI/i }))

    // Nút Dừng tác vụ phải hiển thị khi đang tải
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dừng tác vụ/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Dừng tác vụ/i }))

    // Dialog xác nhận mở ra
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dừng tác vụ & Hoàn credit/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Dừng tác vụ & Hoàn credit/i }))

    await waitFor(() => {
      expect(aiJobService.cancelJob).toHaveBeenCalledWith('job-test-cancel', false)
      expect(capturedSignal?.aborted).toBe(true)
      expect(toast.success).toHaveBeenCalledWith('Đã hủy tác vụ trong hàng chờ và hoàn lại 5 credit.')
    })
  })

  it('graceful fallback khi backend báo ALREADY_PROCESSING: không abort và hiển thị toast hướng dẫn lịch sự', async () => {
    let capturedSignal: AbortSignal | undefined
    vi.mocked(aiBatchQuestionService.batchGenerateQuestionsAsync).mockImplementation(
      async (_params, options) => {
        capturedSignal = options?.signal
        await options?.onJobCreated?.('job-race-condition')
        return new Promise(() => { }) // pending chờ kết quả
      }
    )
    vi.mocked(aiJobService.getJobStatus).mockResolvedValue({
      jobId: 'job-race-condition',
      taskCode: 'BATCH_QUESTION_GEN',
      status: 'QUEUED',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    })
    // Giả lập Race Condition: lúc user bấm hủy, Worker đã bốc job sang PROCESSING
    vi.mocked(aiJobService.cancelJob).mockResolvedValue({
      jobId: 'job-race-condition',
      status: 'PROCESSING',
      cancelled: false,
      refunded: false,
      refundedCredits: 0,
      code: 'ALREADY_PROCESSING',
      message: 'Tác vụ AI đã bắt đầu xử lý. Hệ thống tiếp tục thực hiện để tránh lãng phí credit.',
    })

    render(
      <AiBatchQuestionGeneratorModal isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    )

    const textarea = screen.getByPlaceholderText(/Dán toàn bộ nội dung đề bài/i)
    fireEvent.change(textarea, { target: { value: 'Đề bài...' } })

    fireEvent.click(screen.getByRole('button', { name: /Tách bài tập bằng AI/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dừng tác vụ/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Dừng tác vụ/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dừng tác vụ & Hoàn credit/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Dừng tác vụ & Hoàn credit/i }))

    await waitFor(() => {
      expect(aiJobService.cancelJob).toHaveBeenCalledWith('job-race-condition', false)
      // Tác vụ KHÔNG bị abort! Vẫn tiếp tục chạy!
      expect(capturedSignal?.aborted).toBe(false)
      // Hiển thị toast thông báo lịch sự
      expect(toast.info).toHaveBeenCalledWith(
        expect.stringContaining('AI vừa bắt đầu xử lý đề bài cho bạn!'),
        expect.anything()
      )
    })
  })
})

