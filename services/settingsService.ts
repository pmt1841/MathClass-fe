import api from '@/lib/axios'

export type NotificationSettings = {
  masterEmail: boolean;
  teacherJoinRequest: boolean;
  teacherNewSubmission: boolean;
  studentNewAssignment: boolean;
  studentGraded: boolean;
  studentDeadlineReminder: boolean;
}

export const settingsService = {
  getNotificationSettings: async () => {
    const response = await api.get<NotificationSettings>('/settings/notifications')
    return response.data
  },

  updateNotificationSettings: async (data: NotificationSettings) => {
    const response = await api.put<NotificationSettings>('/settings/notifications', data)
    return response.data
  }
}
