import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

/** Lịch sử giao dịch credit của người dùng hiện tại. */
export function useMyCreditTransactions() {
  return useQuery<CreditTransactionItem[]>({
    queryKey: ['credits', 'me', 'transactions'],
    queryFn: () => creditService.getMyTransactions(),
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
 * Mua gói credit (2 bước: tạo đơn → xác nhận thanh toán).
 * Với Mock gateway, đơn hoàn thành ngay; khi tích hợp cổng thanh toán thật
 * sẽ có bước redirect trước khi confirm.
 */
export function usePurchaseCredit() {
  const queryClient = useQueryClient()

  return useMutation<CreditPurchaseOrder, Error, number>({
    mutationFn: async (packageId: number) => {
      const order = await creditService.purchase(packageId)
      if (order?.orderId) {
        return creditService.completePurchase(order.orderId)
      }
      return order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['credits', 'me', 'transactions'] })
    },
  })
}
