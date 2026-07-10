import api from '@/lib/axios'
import { NotificationResponse } from '@/types/notification'

export const notificationService = {
  getNotifications: async (page = 0, size = 10) => {
    const { data } = await api.get<{ content: NotificationResponse[], totalElements: number, totalPages: number }>(`/notifications?page=${page}&size=${size}`)
    return data
  },

  getUnreadCount: async () => {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count')
    return data
  },

  markAllAsRead: async () => {
    await api.put('/notifications/read-all')
  },

  markAsRead: async (id: number) => {
    await api.put(`/notifications/${id}/read`)
  }
}
