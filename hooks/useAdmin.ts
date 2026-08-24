import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'

export function useAdminUsers(page: number, role?: string, isActive?: boolean, search?: string, size: number = 10) {
  return useQuery({
    queryKey: ['admin-users', page, role, isActive, search, size],
    queryFn: () => adminService.getUsers(page, role, isActive, search, size),
    placeholderData: keepPreviousData,
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, isActive, reason }: { userId: number; isActive: boolean; reason?: string }) =>
      adminService.updateUserStatus(userId, isActive, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}


export function useAdminLogs(
  page: number,
  level?: string,
  resourceType?: string,
  startDate?: string,
  endDate?: string,
  size: number = 10
) {
  return useQuery({
    queryKey: ['admin-logs', page, level, resourceType, startDate, endDate, size],
    queryFn: () => adminService.getLogs(page, level, resourceType, startDate, endDate, size),
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
  })
}

export function useAllPermissions() {
  return useQuery({
    queryKey: ['admin-permissions'],
    queryFn: adminService.getAllPermissions,
  })
}

export function useRolePermissions(role: string) {
  return useQuery({
    queryKey: ['admin-role-permissions', role],
    queryFn: () => adminService.getRolePermissions(role),
    enabled: !!role,
  })
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ role, permissionIds }: { role: string; permissionIds: number[] }) =>
      adminService.updateRolePermissions(role, permissionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-permissions', variables.role] })
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] })
    },
  })
}

export function useResetRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (role: string) => adminService.resetRolePermissions(role),
    onSuccess: (_, role) => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-permissions', role] })
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] })
    },
  })
}
