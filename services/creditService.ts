import api from '@/lib/axios'

/**
 * API credit AI của người dùng (MAT-255).
 * Base URL đã bao gồm prefix `/api/v1` (xem `@/lib/axios`).
 */

export interface CreditCostItem {
  task: string
  costPerCall: number
  tokensPerCredit?: number | null
}

export interface CreditBalance {
  userId: number
  balance: number
  totalEarned: number
  totalSpent: number
  costs: CreditCostItem[]
}

export interface CreditPackage {
  id: number
  name: string
  credits: number
  price: number
  enabled: boolean
  sortOrder: number
}

export interface CreditPurchaseOrder {
  orderId: number
  gatewayCode: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  redirectUrl?: string | null
  credits: number
  price: number
  creditsAdded?: number
  newBalance?: number
}

export type CreditTransactionType =
  | 'GRANT_DEFAULT'
  | 'PURCHASE'
  | 'ADMIN_ADJUST'
  | 'CONSUME'
  | 'REFUND'

export interface CreditTransactionItem {
  id: number
  userId?: number
  userEmail?: string | null
  userRole?: string | null
  email?: string | null
  role?: string | null
  amount: number
  type: CreditTransactionType
  task?: string | null
  referenceId?: number | null
  description?: string | null
  createdAt: string
}

export const creditService = {
  getMyBalance: async (): Promise<CreditBalance> => {
    const res = await api.get<CreditBalance>('/credits/me')
    return res.data
  },

  getMyTransactions: async (): Promise<CreditTransactionItem[]> => {
    const res = await api.get<CreditTransactionItem[]>('/credits/transactions')
    return res.data
  },

  getPackages: async (): Promise<CreditPackage[]> => {
    const res = await api.get<CreditPackage[]>('/credits/packages')
    return res.data
  },

  purchase: async (packageId: number): Promise<CreditPurchaseOrder> => {
    const res = await api.post<CreditPurchaseOrder>('/credits/purchase', { packageId })
    return res.data
  },

  completePurchase: async (orderId: number): Promise<CreditPurchaseOrder> => {
    const res = await api.post<CreditPurchaseOrder>(`/credits/purchase/${orderId}/complete`)
    return res.data
  },

  refundTask: async (task: string): Promise<void> => {
    await api.post('/credits/refund-task', null, { params: { task } })
  },
}
