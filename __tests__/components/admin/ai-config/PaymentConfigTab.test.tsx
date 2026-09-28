import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaymentConfigTab } from '@/components/admin/ai-config/PaymentConfigTab'

const mockUpdateMutation = vi.fn().mockResolvedValue({})
const mockToggleMutation = vi.fn().mockResolvedValue({})

const mockConfig = {
  id: 1,
  bankCode: 'MB',
  accountNumber: '0348714099',
  accountHolderName: 'MATHCLASS ADMIN',
  sepayApiKey: 'test-sepay-key',
  transferSyntaxPrefix: 'MAT',
  qrTemplate: 'compact2',
  isActive: true,
}

vi.mock('@/hooks/usePaymentConfig', () => ({
  useAdminPaymentConfig: () => ({
    data: mockConfig,
    isLoading: false,
  }),
  useUpdatePaymentConfig: () => ({
    isPending: false,
    mutateAsync: mockUpdateMutation,
  }),
  useTogglePaymentActive: () => ({
    isPending: false,
    mutateAsync: mockToggleMutation,
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('PaymentConfigTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form with existing payment config', () => {
    render(<PaymentConfigTab />)

    expect(screen.getByText(/Cấu hình Tài khoản Ngân hàng Nhận tiền/)).toBeTruthy()
    expect(screen.getByDisplayValue('0348714099')).toBeTruthy()
    expect(screen.getByDisplayValue('MATHCLASS ADMIN')).toBeTruthy()
    expect(screen.getByDisplayValue('MAT')).toBeTruthy()
    expect(screen.getByText(/Cú pháp chuyển khoản tự động/)).toBeTruthy()
  })

  it('should submit updated payment config when clicking save', async () => {
    render(<PaymentConfigTab />)

    const accountInput = screen.getByDisplayValue('0348714099')
    fireEvent.change(accountInput, { target: { value: '0987654321' } })

    const prefixInput = screen.getByDisplayValue('MAT')
    fireEvent.change(prefixInput, { target: { value: 'MC' } })

    const saveButton = screen.getByText('Lưu cấu hình')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          accountNumber: '0987654321',
          bankCode: 'MB',
          transferSyntaxPrefix: 'MC',
        })
      )
    })
  })

  it('should validate transferSyntaxPrefix before submitting', async () => {
    const { toast } = await import('sonner')
    render(<PaymentConfigTab />)

    const prefixInput = screen.getByDisplayValue('MAT')
    const saveButton = screen.getByText('Lưu cấu hình')

    // Test 1: Single character (too short)
    fireEvent.change(prefixInput, { target: { value: 'M' } })
    fireEvent.click(saveButton)
    expect(toast.error).toHaveBeenCalledWith('Tiền tố cú pháp chuyển khoản phải có từ 2 đến 10 ký tự')
    expect(mockUpdateMutation).not.toHaveBeenCalled()

    // Test 2: Starts with number or contains special character
    fireEvent.change(prefixInput, { target: { value: '1MAT' } })
    fireEvent.click(saveButton)
    expect(toast.error).toHaveBeenCalledWith('Tiền tố phải bắt đầu bằng chữ cái và chỉ chứa chữ cái hoặc số')
    expect(mockUpdateMutation).not.toHaveBeenCalled()

    // Test 3: Reserved word
    fireEvent.change(prefixInput, { target: { value: 'REFUND' } })
    fireEvent.click(saveButton)
    expect(toast.error).toHaveBeenCalledWith('Tiền tố "REFUND" trùng với từ khóa hệ thống, vui lòng chọn tiền tố khác')
    expect(mockUpdateMutation).not.toHaveBeenCalled()
  })

  it('should immediately toggle active status when switch is clicked', async () => {
    render(<PaymentConfigTab />)

    const switchBtn = screen.getByRole('switch')
    fireEvent.click(switchBtn)

    await waitFor(() => {
      expect(mockToggleMutation).toHaveBeenCalledWith(false)
    })
  })
})
