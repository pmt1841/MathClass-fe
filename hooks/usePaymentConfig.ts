import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentService } from '@/services/paymentService'
import {
  CreditOrderAdminResponse,
  PageResponse,
  PaymentConfigResponse,
  PaymentConfigUpdateRequest,
  PublicPaymentConfigResponse,
} from '@/types/payment'

export const PAYMENT_CONFIG_KEYS = {
  adminConfig: ['admin', 'payment-config'] as const,
  publicConfig: ['credits', 'payment-config'] as const,
  adminOrders: (params?: { status?: string; search?: string; page?: number; size?: number }) =>
    ['admin', 'credit-orders', params] as const,
}

export function useAdminPaymentConfig() {
  return useQuery<PaymentConfigResponse>({
    queryKey: PAYMENT_CONFIG_KEYS.adminConfig,
    queryFn: paymentService.getAdminPaymentConfig,
  })
}

export function usePublicPaymentConfig() {
  return useQuery<PublicPaymentConfigResponse>({
    queryKey: PAYMENT_CONFIG_KEYS.publicConfig,
    queryFn: paymentService.getPublicPaymentConfig,
  })
}

export function useUpdatePaymentConfig() {
  const queryClient = useQueryClient()
  return useMutation<PaymentConfigResponse, Error, PaymentConfigUpdateRequest>({
    mutationFn: paymentService.updateAdminPaymentConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_CONFIG_KEYS.adminConfig })
      queryClient.invalidateQueries({ queryKey: PAYMENT_CONFIG_KEYS.publicConfig })
    },
  })
}

export function useTogglePaymentActive() {
  const queryClient = useQueryClient()
  return useMutation<PaymentConfigResponse, Error, boolean>({
    mutationFn: (active) => paymentService.togglePaymentActive(active),
    onSuccess: (data) => {
      queryClient.setQueryData(PAYMENT_CONFIG_KEYS.adminConfig, data)
      queryClient.setQueryData<PublicPaymentConfigResponse | undefined>(
        PAYMENT_CONFIG_KEYS.publicConfig,
        (old) => (old ? { ...old, isActive: data.isActive } : old)
      )
      queryClient.invalidateQueries({ queryKey: PAYMENT_CONFIG_KEYS.adminConfig })
      queryClient.invalidateQueries({ queryKey: PAYMENT_CONFIG_KEYS.publicConfig })
    },
  })
}

export function useAdminCreditOrders(params?: { status?: string; search?: string; page?: number; size?: number }) {
  return useQuery<PageResponse<CreditOrderAdminResponse>>({
    queryKey: PAYMENT_CONFIG_KEYS.adminOrders(params),
    queryFn: () => paymentService.getAdminCreditOrders(params),
  })
}

export function useApproveCreditOrder() {
  const queryClient = useQueryClient()
  return useMutation<CreditOrderAdminResponse, Error, number>({
    mutationFn: paymentService.approveCreditOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'credit-orders'] })
    },
  })
}

export function useRefundCreditOrder() {
  const queryClient = useQueryClient()
  return useMutation<CreditOrderAdminResponse, Error, { orderId: number; refundReason?: string }>({
    mutationFn: ({ orderId, refundReason }) =>
      paymentService.refundCreditOrder(orderId, { refundReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'credit-orders'] })
    },
  })
}
