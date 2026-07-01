import api from '../axios'
import { NotificationResponse } from '@/types/notification'

export const getNotifications = async (page = 0, size = 10) => {
  const { data } = await api.get<{ content: NotificationResponse[], totalElements: number, totalPages: number }>(`/notifications?page=${page}&size=${size}`)
  return data
}

export const getUnreadCount = async () => {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count')
  return data
}

export const markAllAsRead = async () => {
  await api.put('/notifications/read-all')
}

export const markAsRead = async (id: number) => {
  await api.put(`/notifications/${id}/read`)
}
