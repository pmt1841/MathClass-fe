import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaymentQrModal } from '@/components/credits/PaymentQrModal'
import { CreditPurchaseOrder } from '@/services/creditService'

const mockOrder: CreditPurchaseOrder = {
  orderId: 102,
  gatewayCode: 'SEPAY_VIETQR',
  status: 'PENDING',
  credits: 100,
  price: 20000,
  bankCode: 'MB',
  accountNumber: '0348714099',
  accountHolderName: 'MATHCLASS ADMIN',
  transferSyntax: 'MAT102',
  qrUrl: 'https://img.vietqr.io/image/MB-0348714099-compact2.png',
}

const mockUseCreditOrderStatus = vi.fn()

vi.mock('@/hooks/useCredits', () => ({
  useCreditOrderStatus: (orderId: number | null, enabled: boolean) =>
    mockUseCreditOrderStatus(orderId, enabled),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('PaymentQrModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCreditOrderStatus.mockReturnValue({
      data: { status: 'PENDING' },
    })

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('should render modal with VietQR image, bank details and transfer syntax', () => {
    render(<PaymentQrModal order={mockOrder} open={true} onClose={vi.fn()} />)

    expect(screen.getByText('Nạp 100 Credit')).toBeTruthy()
    expect(screen.getByText('MB')).toBeTruthy()
    expect(screen.getByText('MATHCLASS ADMIN')).toBeTruthy()
    expect(screen.getByText('0348714099')).toBeTruthy()
    expect(screen.getByText('20.000đ')).toBeTruthy()
    expect(screen.getAllByText('MAT102').length).toBeGreaterThanOrEqual(1)

    const img = screen.getByAltText('Mã QR chuyển khoản VietQR') as HTMLImageElement
    expect(img.src).toContain('https://img.vietqr.io/image/MB-0348714099-compact2.png')
  })

  it('should copy account number and transfer syntax to clipboard', async () => {
    render(<PaymentQrModal order={mockOrder} open={true} onClose={vi.fn()} />)

    const copyButtons = screen.getAllByRole('button')
    // Click copy button for account
    fireEvent.click(copyButtons[0])

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
  })

  it('should switch to success screen when order status becomes SUCCESS', () => {
    mockUseCreditOrderStatus.mockReturnValue({
      data: { status: 'SUCCESS', newBalance: 350 },
    })

    const onClose = vi.fn()
    render(<PaymentQrModal order={mockOrder} open={true} onClose={onClose} />)

    expect(screen.getByText('Thanh toán thành công!')).toBeTruthy()
    expect(screen.getByText(/350 Credit/)).toBeTruthy()

    fireEvent.click(screen.getByText('Hoàn tất'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should fallback to orderCode when transferSyntax is missing', () => {
    const orderWithOrderCodeOnly: CreditPurchaseOrder = {
      ...mockOrder,
      transferSyntax: undefined,
      orderCode: 'MAT 2609280102',
    }

    render(<PaymentQrModal order={orderWithOrderCodeOnly} open={true} onClose={vi.fn()} />)
    expect(screen.getAllByText('MAT 2609280102').length).toBeGreaterThanOrEqual(1)
  })

  it('should show fail-fast error screen when payment info is missing', () => {
    const invalidOrder: CreditPurchaseOrder = {
      orderId: 999,
      gatewayCode: 'SEPAY_VIETQR',
      status: 'PENDING',
      credits: 50,
      price: 10000,
      transferSyntax: undefined,
      orderCode: undefined,
      qrUrl: undefined,
      bankCode: undefined,
      accountNumber: undefined,
    }

    render(<PaymentQrModal order={invalidOrder} open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Không thể tạo thông tin thanh toán')).toBeTruthy()
    expect(screen.getByText(/Hệ thống chưa thể lấy đầy đủ thông tin tài khoản hoặc cú pháp chuyển khoản/)).toBeTruthy()
    expect(screen.getByText('Thử tạo đơn lại')).toBeTruthy()
  })
})
