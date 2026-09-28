import api from '@/lib/axios'
import {
  CreditOrderAdminResponse,
  PageResponse,
  PaymentConfigResponse,
  PaymentConfigUpdateRequest,
  PublicPaymentConfigResponse,
} from '@/types/payment'

export const paymentService = {
  getPublicPaymentConfig: async (): Promise<PublicPaymentConfigResponse> => {
    const res = await api.get<PublicPaymentConfigResponse>('/credits/payment-config')
    return res.data
  },

  getAdminPaymentConfig: async (): Promise<PaymentConfigResponse> => {
    const res = await api.get<PaymentConfigResponse>('/admin/payment-config')
    return res.data
  },

  updateAdminPaymentConfig: async (payload: PaymentConfigUpdateRequest): Promise<PaymentConfigResponse> => {
    const res = await api.put<PaymentConfigResponse>('/admin/payment-config', payload)
    return res.data
  },

  togglePaymentActive: async (active: boolean): Promise<PaymentConfigResponse> => {
    const res = await api.patch<PaymentConfigResponse>('/admin/payment-config/toggle-active', null, {
      params: { active },
    })
    return res.data
  },

  getAdminCreditOrders: async (params?: {
    status?: string
    search?: string
    page?: number
    size?: number
  }): Promise<PageResponse<CreditOrderAdminResponse>> => {
    const res = await api.get<PageResponse<CreditOrderAdminResponse>>('/admin/credit-orders', { params })
    return res.data
  },

  approveCreditOrder: async (orderId: number): Promise<CreditOrderAdminResponse> => {
    const res = await api.post<CreditOrderAdminResponse>(`/admin/credit-orders/${orderId}/approve`)
    return res.data
  },

  refundCreditOrder: async (orderId: number, data?: { refundReason?: string }): Promise<CreditOrderAdminResponse> => {
    const res = await api.post<CreditOrderAdminResponse>(`/admin/credit-orders/${orderId}/refund`, data || {})
    return res.data
  },
}
