import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'

export function useAdminUsers(page: number, role?: string, isActive?: boolean, search?: string) {
  return useQuery({
    queryKey: ['admin-users', page, role, isActive, search],
    queryFn: () => adminService.getUsers(page, role, isActive, search),
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      adminService.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      // Cập nhật thêm log query nếu log page cũng đang mở
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] })
    },
  })
}

export function useAdminLogs(page: number, level?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['admin-logs', page, level, startDate, endDate],
    queryFn: () => adminService.getLogs(page, level, startDate, endDate),
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
