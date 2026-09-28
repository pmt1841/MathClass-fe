import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { PageResponse } from '@/types'
import { CreditOrderStatusResponse } from '@/types/payment'
import {
  creditService,
  CreditBalance,
  CreditPackage,
  CreditPurchaseOrder,
  CreditTransactionItem,
} from '@/services/creditService'

export type {
  CreditBalance,
  CreditCostItem,
  CreditPackage,
  CreditPurchaseOrder,
  CreditTransactionItem,
  CreditTransactionType,
} from '@/services/creditService'

/** Số dư credit + bảng giá của người dùng hiện tại. */
export function useMyCreditBalance() {
  return useQuery<CreditBalance>({
    queryKey: ['credits', 'me'],
    queryFn: () => creditService.getMyBalance(),
    staleTime: 1000 * 60, // 1 phút
    retry: 1,
  })
}

/** Lịch sử giao dịch credit của người dùng hiện tại (hỗ trợ phân trang và filter theo loại). */
export function useMyCreditTransactions(params?: {
  type?: string
  page?: number
  size?: number
}) {
  return useQuery<PageResponse<CreditTransactionItem>>({
    queryKey: [
      'credits',
      'me',
      'transactions',
      params?.type ?? 'ALL',
      params?.page ?? 0,
      params?.size ?? 15,
    ],
    queryFn: () => creditService.getMyTransactions(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    retry: 1,
  })
}

/** Danh sách gói credit đang bán. */
export function useCreditPackages() {
  return useQuery<CreditPackage[]>({
    queryKey: ['credit-packages'],
    queryFn: () => creditService.getPackages(),
    staleTime: 1000 * 60 * 5, // 5 phút
    retry: 1,
  })
}

/**
 * Khởi tạo đơn mua gói credit (trả về order kèm thông tin VietQR để mở Modal thanh toán).
 */
export function usePurchaseCredit() {
  return useMutation<CreditPurchaseOrder, Error, number>({
    mutationFn: (packageId: number) => creditService.purchase(packageId),
  })
}

/**
 * Kiểm tra trạng thái đơn nạp credit (Live Polling mỗi 2.5s khi modal đang mở và đơn PENDING).
 */
export function useCreditOrderStatus(orderId: number | null, enabled: boolean = true) {
  const queryClient = useQueryClient()

  return useQuery<CreditOrderStatusResponse>({
    queryKey: ['credit-order-status', orderId],
    queryFn: () => creditService.getOrderStatus(orderId!),
    enabled: !!orderId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (
        status === 'SUCCESS' ||
        status === 'FAILED' ||
        status === 'CANCELLED' ||
        status === 'EXPIRED_PAID' ||
        status === 'DUPLICATE_PAYMENT' ||
        status === 'REFUNDED'
      ) {
        return false
      }
      return 2500
    },
  })
}
