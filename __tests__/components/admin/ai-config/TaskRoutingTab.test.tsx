import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskRoutingTab } from '@/components/admin/ai-config/TaskRoutingTab'
import { aiConfigService, TaskConfig } from '@/services/aiConfigService'

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const { toastSuccessMock, toastErrorMock, updateTaskConfigMock, getTaskConfigMock, getProvidersMock, invalidateQueriesMock } =
  vi.hoisted(() => ({
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
    updateTaskConfigMock: vi.fn(),
    getTaskConfigMock: vi.fn(),
    getProvidersMock: vi.fn(),
    invalidateQueriesMock: vi.fn(),
  }))

vi.mock('@/services/aiConfigService', async () => {
  const actual = await vi.importActual<typeof import('@/services/aiConfigService')>('@/services/aiConfigService')
  return {
    ...actual,
    aiConfigService: {
      getProviders: getProvidersMock,
      getTaskConfig: getTaskConfigMock,
      updateTaskConfig: updateTaskConfigMock,
    },
  }
})

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
  }
})

// Mock component phụ thuộc gọi API / UI nặng
vi.mock('@/components/admin/ai-config/ModelInputWithFetch', () => ({
  ModelInputWithFetch: ({ value, onChange, providerId }: any) => (
    <input
      data-testid="model-input"
      value={value ?? ''}
      placeholder="model"
      onChange={(e) => onChange?.(e.target.value)}
      aria-label={`model-${providerId}`}
    />
  ),
}))

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } })

const configuredTask: TaskConfig = {
  task: 'ASSIGNMENT_GRADING',
  providerId: 1,
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  maxToken: 2048,
  enabled: true,
  updatedAt: '2026-08-08T08:00:00',
}

const renderTab = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <TaskRoutingTab />
    </QueryClientProvider>
  )

describe('TaskRoutingTab — MAT-254 Feature Flag toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getProvidersMock.mockResolvedValue([
      { id: 1, code: 'GEMINI', name: 'Google Gemini', protocol: 'GOOGLE_GEMINI_COMPATIBLE', strategy: 'PRIORITY', status: 'ACTIVE' },
    ])
    // Mặc định: mọi task đã cấu hình & bật
    getTaskConfigMock.mockImplementation(() => Promise.resolve({ ...configuredTask }))
    updateTaskConfigMock.mockImplementation((task: string, data: any) =>
      Promise.resolve({ task, ...data, updatedAt: '2026-08-08T08:00:00' })
    )
  })

  it('bật/tắt Switch gọi updateTaskConfig, hiển thị toast và invalidate cache /ai/features', async () => {
    renderTab()

    // Chờ dữ liệu nạp xong (có ít nhất 1 Switch hiển thị)
    const switches = await screen.findAllByRole('switch')
    expect(switches.length).toBeGreaterThan(0)

    // Tắt tính năng đầu tiên (mặc định đang bật)
    fireEvent.click(switches[0])

    await waitFor(() => {
      expect(updateTaskConfigMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ enabled: false })
      )
    })

    expect(toastSuccessMock).toHaveBeenCalledWith(
      expect.stringContaining('Đã tắt tính năng'),
      expect.anything()
    )
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['ai-features'] })
  })

  it('bật Switch khi task đã được cấu hình gọi updateTaskConfig với enabled=true', async () => {
    // Task đầu tiên đang TẮT
    getTaskConfigMock.mockImplementation(() =>
      Promise.resolve({ ...configuredTask, enabled: false })
    )
    renderTab()

    const switches = await screen.findAllByRole('switch')
    expect(switches[0]).toHaveAttribute('data-state', 'unchecked')

    fireEvent.click(switches[0])

    await waitFor(() => {
      expect(updateTaskConfigMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ enabled: true })
      )
    })

    expect(toastSuccessMock).toHaveBeenCalledWith(
      expect.stringContaining('Đã bật tính năng'),
      expect.anything()
    )
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['ai-features'] })
  })

  it('không cho bật tính năng khi task chưa có Provider/Model (fail-safe)', async () => {
    // Task chưa được cấu hình trong CSDL -> 404
    getTaskConfigMock.mockRejectedValue(new Error('Not found'))
    renderTab()

    const switches = await screen.findAllByRole('switch')
    // Task chưa cấu hình mặc định hiển thị TẮT
    expect(switches[0]).toHaveAttribute('data-state', 'unchecked')

    fireEvent.click(switches[0])

    // Không gọi API vì chưa có providerId/model
    expect(updateTaskConfigMock).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        expect.stringContaining('Chưa thể bật tính năng'),
        expect.anything()
      )
    })
  })

  it('khi lưu thất bại hiển thị toast lỗi và rollback Switch về trạng thái cũ', async () => {
    updateTaskConfigMock.mockRejectedValue(new Error('Server error'))
    renderTab()

    const switches = await screen.findAllByRole('switch')
    expect(switches[0]).toHaveAttribute('data-state', 'checked')

    fireEvent.click(switches[0])

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Cập nhật thất bại',
        expect.anything()
      )
    })

    // Switch phải quay về trạng thái bật
    await waitFor(() => {
      expect(screen.getAllByRole('switch')[0]).toHaveAttribute('data-state', 'checked')
    })
  })

  it('OPTIMISTIC: Switch đổi trạng thái ngay lập tức trước khi backend trả về (không giật)', async () => {
    // API chưa resolve (mô phỏng độ trễ mạng)
    let resolveUpdate!: (value: any) => void
    updateTaskConfigMock.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve
      })
    )
    renderTab()

    const switches = await screen.findAllByRole('switch')
    expect(switches[0]).toHaveAttribute('data-state', 'checked')

    fireEvent.click(switches[0])

    // Ngay sau click, UI phải đổi sang TẮT dù API chưa resolve
    await waitFor(() => {
      expect(screen.getAllByRole('switch')[0]).toHaveAttribute('data-state', 'unchecked')
    })
    expect(updateTaskConfigMock).toHaveBeenCalledTimes(1)

    // Sau đó backend trả về thành công -> giữ trạng thái mới
    resolveUpdate({
      task: 'ASSIGNMENT_GRADING',
      providerId: 1,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxToken: 2048,
      enabled: false,
      updatedAt: '2026-08-08T08:05:00',
    })
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        expect.stringContaining('Đã tắt tính năng'),
        expect.anything()
      )
    })
  })

  it('payload gửi lên server dùng config ĐÃ LƯU, không ghi đè thay đổi đang gõ dở', async () => {
    renderTab()

    // Admin đang sửa Model mới (chưa lưu) — field editable luôn bật
    const modelInput = (await screen.findAllByTestId('model-input'))[0]
    fireEvent.change(modelInput, { target: { value: 'gpt-4o-mới' } })

    // Bấm Switch để bật/tắt (chỉ thay đổi enabled)
    const switches = await screen.findAllByRole('switch')
    fireEvent.click(switches[0])

    await waitFor(() => {
      expect(updateTaskConfigMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ enabled: false, model: 'gemini-2.5-flash' })
      )
    })
    // Model đang gõ dở KHÔNG được gửi lên (dùng config đã lưu)
    expect(updateTaskConfigMock).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ model: 'gpt-4o-mới' })
    )
  })
})
