import api from '@/lib/axios'
import { AdminDashboardStats } from '@/types/admin-dashboard'

export interface ApiResponse<T> {
  code: number
  message: string
  result: T
}

export const adminDashboardService = {
  async getStats(month?: number, year?: number): Promise<AdminDashboardStats> {
    const params = new URLSearchParams()
    if (month) params.append('month', month.toString())
    if (year) params.append('year', year.toString())
    const query = params.toString() ? `?${params.toString()}` : ''

    const response = await api.get<ApiResponse<AdminDashboardStats>>(`/admin/dashboard/stats${query}`)
    return response.data.result
  },
}
