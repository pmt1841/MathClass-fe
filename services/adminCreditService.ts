import api from '@/lib/axios'
import { PageResponse } from '@/types'
import { CreditPackage, CreditTransactionItem } from './creditService'

/**
 * API admin quản lý credit AI (MAT-255):
 *  - Chi phí credit theo task AI
 *  - Credit mặc định cấp theo vai trò
 *  - CRUD gói credit
 *  - Điều chỉnh credit thủ công + sổ cái giao dịch
 */

export interface TaskCreditConfig {
  id: number
  task: string
  costPerCall: number
  tokensPerCredit?: number | null
  enabled: boolean
  updatedAt?: string
}

export interface DefaultCreditConfig {
  role: 'STUDENT' | 'TEACHER'
  defaultCredits: number
}

export interface TaskCreditConfigUpdateRequest {
  costPerCall: number
  tokensPerCredit?: number | null
  enabled: boolean
}

export interface DefaultCreditUpdateRequest {
  defaultCredits: number
}

export interface CreditPackageCreateRequest {
  name: string
  credits: number
  price: number
  enabled?: boolean
  sortOrder?: number
}

export type CreditPackageUpdateRequest = CreditPackageCreateRequest

export interface CreditAdjustRequest {
  userId: number
  amount: number
  reason?: string
}

export interface BatchCreditAdjustRequest {
  userIds: number[]
  amount: number
  reason?: string
}

export interface BatchCreditAdjustResponse {
  total: number
  successCount: number
  failureCount: number
  errors: string[]
  message: string
}

export const adminCreditService = {
  // Chi phí credit theo task
  getTaskCreditConfigs: async (): Promise<TaskCreditConfig[]> => {
    const res = await api.get<TaskCreditConfig[]>('/admin/ai-credit-config/tasks')
    return res.data
  },

  updateTaskCreditConfig: async (
    task: string,
    data: TaskCreditConfigUpdateRequest
  ): Promise<TaskCreditConfig> => {
    const res = await api.put<TaskCreditConfig>(`/admin/ai-credit-config/tasks/${task}`, data)
    return res.data
  },

  // Credit mặc định theo role
  getDefaultCredits: async (): Promise<DefaultCreditConfig[]> => {
    const res = await api.get<DefaultCreditConfig[]>('/admin/ai-credit-config/defaults')
    return res.data
  },

  updateDefaultCredits: async (
    role: string,
    data: DefaultCreditUpdateRequest
  ): Promise<DefaultCreditConfig> => {
    const res = await api.put<DefaultCreditConfig>(`/admin/ai-credit-config/defaults/${role}`, data)
    return res.data
  },

  // Gói credit
  getPackages: async (): Promise<CreditPackage[]> => {
    const res = await api.get<CreditPackage[]>('/admin/credit-packages')
    return res.data
  },

  createPackage: async (data: CreditPackageCreateRequest): Promise<CreditPackage> => {
    const res = await api.post<CreditPackage>('/admin/credit-packages', data)
    return res.data
  },

  updatePackage: async (id: number, data: CreditPackageUpdateRequest): Promise<CreditPackage> => {
    const res = await api.put<CreditPackage>(`/admin/credit-packages/${id}`, data)
    return res.data
  },

  deletePackage: async (id: number): Promise<void> => {
    await api.delete(`/admin/credit-packages/${id}`)
  },

  // Điều chỉnh credit thủ công
  adjust: async (data: CreditAdjustRequest): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/admin/credits/adjust', data)
    return res.data
  },

  // Điều chỉnh credit hàng loạt cho nhiều user
  adjustBatch: async (data: BatchCreditAdjustRequest): Promise<BatchCreditAdjustResponse> => {
    const res = await api.post<BatchCreditAdjustResponse>('/admin/credits/adjust-batch', data)
    return res.data
  },

  // Sổ cái giao dịch
  getTransactions: async (params?: {
    userId?: number
    type?: string
    page?: number
    size?: number
  }): Promise<PageResponse<CreditTransactionItem>> => {
    const res = await api.get<PageResponse<CreditTransactionItem>>('/admin/credits/transactions', {
      params: {
        userId: params?.userId,
        type: params?.type,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      },
    })
    return res.data
  },
}

// Re-export type để tiện import
export type { CreditPackage, CreditTransactionItem }
