import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { PageResponse } from '@/types'
import {
  adminCreditService,
  TaskCreditConfig,
  DefaultCreditConfig,
  CreditAdjustRequest,
  CreditPackageCreateRequest,
  CreditPackageUpdateRequest,
} from '@/services/adminCreditService'
import { CreditPackage, CreditTransactionItem } from '@/services/creditService'

export type { TaskCreditConfig, DefaultCreditConfig }

/** Danh sách chi phí credit theo task AI (admin). */
export function useAdminTaskCreditConfigs() {
  return useQuery<TaskCreditConfig[]>({
    queryKey: ['admin-credit-config-tasks'],
    queryFn: () => adminCreditService.getTaskCreditConfigs(),
    retry: 1,
  })
}

export function useUpdateTaskCreditConfig() {
  const queryClient = useQueryClient()
  return useMutation<
    TaskCreditConfig,
    Error,
    { task: string; data: { costPerCall: number; tokensPerCredit?: number | null; enabled: boolean } }
  >({
    mutationFn: ({ task, data }) => adminCreditService.updateTaskCreditConfig(task, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-credit-config-tasks'] }),
  })
}

/** Danh sách credit mặc định theo role (admin). */
export function useAdminDefaultCredits() {
  return useQuery<DefaultCreditConfig[]>({
    queryKey: ['admin-credit-config-defaults'],
    queryFn: () => adminCreditService.getDefaultCredits(),
    retry: 1,
  })
}

export function useUpdateDefaultCredits() {
  const queryClient = useQueryClient()
  return useMutation<DefaultCreditConfig, Error, { role: string; defaultCredits: number }>({
    mutationFn: ({ role, defaultCredits }) => adminCreditService.updateDefaultCredits(role, { defaultCredits }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-credit-config-defaults'] }),
  })
}

/** Tất cả gói credit (admin, gồm cả gói đã tắt). */
export function useAdminPackages() {
  return useQuery<CreditPackage[]>({
    queryKey: ['admin-credit-packages'],
    queryFn: () => adminCreditService.getPackages(),
    retry: 1,
  })
}

export function useCreateCreditPackage() {
  const queryClient = useQueryClient()
  return useMutation<CreditPackage, Error, CreditPackageCreateRequest>({
    mutationFn: (data) => adminCreditService.createPackage(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-credit-packages'] }),
  })
}

export function useUpdateCreditPackage() {
  const queryClient = useQueryClient()
  return useMutation<CreditPackage, Error, { id: number; data: CreditPackageUpdateRequest }>({
    mutationFn: ({ id, data }) => adminCreditService.updatePackage(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-credit-packages'] }),
  })
}

export function useDeleteCreditPackage() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: (id) => adminCreditService.deletePackage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-credit-packages'] }),
  })
}

/** Điều chỉnh credit thủ công (grant / hoàn tiền). */
export function useAdjustCredit() {
  const queryClient = useQueryClient()
  return useMutation<{ message: string }, Error, CreditAdjustRequest>({
    mutationFn: (data) => adminCreditService.adjust(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-credit-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['credits', 'me'] })
    },
  })
}

/** Sổ cái giao dịch credit (admin). */
export function useAdminCreditTransactions(params?: {
  userId?: number
  type?: string
  page?: number
  size?: number
}) {
  return useQuery<PageResponse<CreditTransactionItem>>({
    queryKey: [
      'admin-credit-transactions',
      params?.userId ?? 'all',
      params?.type ?? 'all',
      params?.page ?? 0,
      params?.size ?? 10,
    ],
    queryFn: () => adminCreditService.getTransactions(params),
    placeholderData: keepPreviousData,
    retry: 1,
  })
}
