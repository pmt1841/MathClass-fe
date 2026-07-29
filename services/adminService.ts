import api from '@/lib/axios'
import { AdminUser, PageResponse } from '@/types'

export interface SystemLog {
  id: number
  timestamp: string
  actor: string
  action: string
  level: 'INFO' | 'WARNING' | 'ERROR'
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  status?: 'SUCCESS' | 'FAILED'
}

export interface Permission {
  id: number
  name: string
  description: string
}

export const adminService = {
  getUsers: async (page: number, role?: string, isActive?: boolean, search?: string) => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    if (role) params.append('role', role)
    if (isActive !== undefined) params.append('isActive', String(isActive))
    if (search) params.append('search', search)

    const response = await api.get<PageResponse<AdminUser>>(`/admin/users?${params.toString()}`)
    return response.data
  },

  updateUserStatus: async (userId: number, isActive: boolean) => {
    const response = await api.patch<{ message: string }>(`/admin/users/${userId}/status`, { isActive })
    return response.data
  },

  getLogs: async (page: number, level?: string, resourceType?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    if (level && level !== 'ALL') params.append('level', level)
    if (resourceType && resourceType !== 'ALL') params.append('resourceType', resourceType)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const response = await api.get<PageResponse<SystemLog>>(`/admin/logs?${params.toString()}`)
    return response.data
  },

  getAllPermissions: async () => {
    const response = await api.get<Permission[]>('/admin/roles/permissions')
    return response.data
  },

  getRolePermissions: async (role: string) => {
    const response = await api.get<Permission[]>(`/admin/roles/${role}/permissions`)
    return response.data
  },

  updateRolePermissions: async (role: string, permissionIds: number[]) => {
    const response = await api.put<{ message: string }>(`/admin/roles/${role}/permissions`, { permissionIds })
    return response.data
  },

  resetRolePermissions: async (role: string) => {
    const response = await api.post<{ message: string }>(`/admin/roles/${role}/reset-permissions`)
    return response.data
  }
}
