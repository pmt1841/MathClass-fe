import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useMyCreditBalance,
  useMyCreditTransactions,
  useCreditPackages,
  usePurchaseCredit,
} from '@/hooks/useCredits'
import { creditService, CreditBalance, CreditPackage, CreditPurchaseOrder } from '@/services/creditService'
import { PageResponse } from '@/types'

vi.mock('@/services/creditService', () => ({
  creditService: {
    getMyBalance: vi.fn(),
    getMyTransactions: vi.fn(),
    getPackages: vi.fn(),
    purchase: vi.fn(),
    completePurchase: vi.fn(),
  },
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCredits hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useMyCreditBalance', () => {
    it('gọi creditService.getMyBalance và trả về số dư credit cùng bảng chi phí', async () => {
      const mockBalance: CreditBalance = {
        userId: 1,
        balance: 150,
        totalEarned: 200,
        totalSpent: 50,
        costs: [
          { task: 'SUBMISSION_GRADING', costPerCall: 5 },
          { task: 'STUDENT_HINT', costPerCall: 1 },
        ],
      }
      vi.mocked(creditService.getMyBalance).mockResolvedValueOnce(mockBalance)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useMyCreditBalance(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(creditService.getMyBalance).toHaveBeenCalledTimes(1)
      expect(result.current.data).toEqual(mockBalance)
      expect(result.current.data?.balance).toBe(150)
    })
  })

  describe('useMyCreditTransactions', () => {
    it('gọi creditService.getMyTransactions với params mặc định', async () => {
      const mockPage = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 15,
        number: 0,
      } as unknown as PageResponse<any>
      vi.mocked(creditService.getMyTransactions).mockResolvedValueOnce(mockPage)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useMyCreditTransactions(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(creditService.getMyTransactions).toHaveBeenCalledWith(undefined)
      expect(result.current.data).toEqual(mockPage)
    })

    it('gọi creditService.getMyTransactions với params lọc theo type và trang', async () => {
      const params = { type: 'PURCHASE', page: 1, size: 10 }
      const mockPage = {
        content: [
          {
            id: 1,
            amount: 100,
            type: 'PURCHASE',
            description: 'Nạp gói 100 credits',
            createdAt: '2026-09-11T10:00:00Z',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 1,
      } as unknown as PageResponse<any>
      vi.mocked(creditService.getMyTransactions).mockResolvedValueOnce(mockPage)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useMyCreditTransactions(params), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(creditService.getMyTransactions).toHaveBeenCalledWith(params)
      expect(result.current.data?.content).toHaveLength(1)
    })
  })

  describe('useCreditPackages', () => {
    it('gọi creditService.getPackages và trả về danh sách các gói nạp', async () => {
      const mockPackages: CreditPackage[] = [
        { id: 1, name: 'Gói Starter', credits: 50, price: 30000, enabled: true, sortOrder: 1 },
        { id: 2, name: 'Gói Pro', credits: 200, price: 100000, enabled: true, sortOrder: 2 },
      ]
      vi.mocked(creditService.getPackages).mockResolvedValueOnce(mockPackages)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useCreditPackages(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(creditService.getPackages).toHaveBeenCalledTimes(1)
      expect(result.current.data).toEqual(mockPackages)
    })
  })

  describe('usePurchaseCredit', () => {
    it('mua gói thành công qua 2 bước (purchase -> completePurchase) và invalidate queries liên quan', async () => {
      const mockOrder: CreditPurchaseOrder = {
        orderId: 1001,
        gatewayCode: 'MOCK_PAY',
        credits: 200,
        price: 100000,
        status: 'PENDING',
      }
      const mockCompletedOrder: CreditPurchaseOrder = {
        ...mockOrder,
        status: 'SUCCESS',
      }

      vi.mocked(creditService.purchase).mockResolvedValueOnce(mockOrder)
      vi.mocked(creditService.completePurchase).mockResolvedValueOnce(mockCompletedOrder)

      const queryClient = createTestQueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => usePurchaseCredit(), {
        wrapper: createWrapper(queryClient),
      })

      let mutationResult: CreditPurchaseOrder | undefined
      await act(async () => {
        mutationResult = await result.current.mutateAsync(2)
      })

      expect(creditService.purchase).toHaveBeenCalledWith(2)
      expect(creditService.completePurchase).toHaveBeenCalledWith(1001)
      expect(mutationResult).toEqual(mockCompletedOrder)
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['credits', 'me'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['credits', 'me', 'transactions'] })
    })

    it('nếu purchase không trả về orderId thì không gọi completePurchase', async () => {
      const mockOrder = {
        orderId: 0,
        gatewayCode: 'MOCK_PAY',
        credits: 0,
        price: 0,
        status: 'FAILED',
      } as CreditPurchaseOrder

      vi.mocked(creditService.purchase).mockResolvedValueOnce(mockOrder)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => usePurchaseCredit(), {
        wrapper: createWrapper(queryClient),
      })

      let mutationResult: CreditPurchaseOrder | undefined
      await act(async () => {
        mutationResult = await result.current.mutateAsync(1)
      })

      expect(creditService.purchase).toHaveBeenCalledWith(1)
      expect(creditService.completePurchase).not.toHaveBeenCalled()
      expect(mutationResult).toEqual(mockOrder)
    })
  })
})
