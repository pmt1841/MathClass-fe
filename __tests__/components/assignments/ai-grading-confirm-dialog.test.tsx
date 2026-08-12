import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AiGradingConfirmDialog } from '@/components/assignments/ai-grading-confirm-dialog'

const makeProps = (overrides: Partial<React.ComponentProps<typeof AiGradingConfirmDialog>> = {}) => ({
  open: true,
  studentName: 'Tran Van B',
  onMinimize: vi.fn(),
  onCancel: vi.fn(),
  onContinueViewing: vi.fn(),
  ...overrides,
})

describe('AiGradingConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly when open', () => {
    render(<AiGradingConfirmDialog {...makeProps()} />)

    expect(screen.getByText('Tiến trình AI đang chạy')).toBeInTheDocument()
    expect(screen.getByText(/Hệ thống đang đối chiếu hình vẽ Canvas/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ẩn & Chạy ngầm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hủy chấm bài/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tiếp tục xem/i })).toBeInTheDocument()
  })

  it('triggers onMinimize when clicking "Ẩn & Chạy ngầm"', () => {
    const onMinimize = vi.fn()
    render(<AiGradingConfirmDialog {...makeProps({ onMinimize })} />)

    fireEvent.click(screen.getByRole('button', { name: /Ẩn & Chạy ngầm/i }))
    expect(onMinimize).toHaveBeenCalledTimes(1)
  })

  it('triggers onCancel when clicking "Hủy chấm bài"', () => {
    const onCancel = vi.fn()
    render(<AiGradingConfirmDialog {...makeProps({ onCancel })} />)

    fireEvent.click(screen.getByRole('button', { name: /Hủy chấm bài/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('triggers onContinueViewing when clicking "Tiếp tục xem"', () => {
    const onContinueViewing = vi.fn()
    render(<AiGradingConfirmDialog {...makeProps({ onContinueViewing })} />)

    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục xem/i }))
    expect(onContinueViewing).toHaveBeenCalledTimes(1)
  })
})
