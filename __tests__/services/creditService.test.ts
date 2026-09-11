import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { creditService } from '@/services/creditService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('creditService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMyBalance gọi GET /credits/me và trả về CreditBalance', async () => {
    const mockBalance = {
      userId: 1,
      balance: 150,
      totalEarned: 200,
      totalSpent: 50,
      costs: [{ task: 'QUESTION_GEN', costPerCall: 2 }],
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockBalance })

    const result = await creditService.getMyBalance()

    expect(api.get).toHaveBeenCalledWith('/credits/me')
    expect(result).toEqual(mockBalance)
  })

  it('getMyTransactions gọi GET /credits/transactions với filter type và pagination', async () => {
    const mockPage = {
      content: [{ id: 1, amount: 10, type: 'GRANT_DEFAULT' }],
      totalElements: 1,
      totalPages: 1,
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockPage })

    const result = await creditService.getMyTransactions({ type: 'PURCHASE', page: 1, size: 10 })

    expect(api.get).toHaveBeenCalledWith('/credits/transactions', {
      params: { type: 'PURCHASE', page: 1, size: 10 },
    })
    expect(result).toEqual(mockPage)
  })

  it('getMyTransactions bỏ qua type khi type là ALL', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { content: [] } })

    await creditService.getMyTransactions({ type: 'ALL', page: 0, size: 15 })

    expect(api.get).toHaveBeenCalledWith('/credits/transactions', {
      params: { type: undefined, page: 0, size: 15 },
    })
  })

  it('getPackages gọi GET /credits/packages và trả về danh sách gói credit', async () => {
    const mockPackages = [{ id: 1, name: 'Gói Cơ Bản', credits: 100, price: 50000 }]
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockPackages })

    const result = await creditService.getPackages()

    expect(api.get).toHaveBeenCalledWith('/credits/packages')
    expect(result).toEqual(mockPackages)
  })

  it('purchase gọi POST /credits/purchase với packageId', async () => {
    const mockOrder = { orderId: 101, status: 'PENDING', credits: 100 }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockOrder })

    const result = await creditService.purchase(1)

    expect(api.post).toHaveBeenCalledWith('/credits/purchase', { packageId: 1 })
    expect(result).toEqual(mockOrder)
  })

  it('completePurchase gọi POST /credits/purchase/{orderId}/complete', async () => {
    const mockOrder = { orderId: 101, status: 'SUCCESS', newBalance: 250 }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockOrder })

    const result = await creditService.completePurchase(101)

    expect(api.post).toHaveBeenCalledWith('/credits/purchase/101/complete')
    expect(result).toEqual(mockOrder)
  })

  it('refundTask gọi POST /credits/refund-task với params task', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: null })

    await creditService.refundTask('QUESTION_GEN')

    expect(api.post).toHaveBeenCalledWith('/credits/refund-task', null, {
      params: { task: 'QUESTION_GEN' },
    })
  })
})
