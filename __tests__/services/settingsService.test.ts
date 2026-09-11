import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { settingsService, NotificationSettings } from '@/services/settingsService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getNotificationSettings - gọi GET /settings/notifications và trả về cài đặt thông báo', async () => {
    const mockSettings: NotificationSettings = {
      masterEmail: true,
      teacherJoinRequest: true,
      teacherNewSubmission: true,
      studentNewAssignment: false,
      studentGraded: true,
      studentDeadlineReminder: true,
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockSettings })

    const result = await settingsService.getNotificationSettings()

    expect(api.get).toHaveBeenCalledWith('/settings/notifications')
    expect(result).toEqual(mockSettings)
    expect(result.masterEmail).toBe(true)
    expect(result.studentNewAssignment).toBe(false)
  })

  it('updateNotificationSettings - gọi PUT /settings/notifications cập nhật cấu hình thông báo', async () => {
    const updatedSettings: NotificationSettings = {
      masterEmail: false,
      teacherJoinRequest: false,
      teacherNewSubmission: true,
      studentNewAssignment: true,
      studentGraded: true,
      studentDeadlineReminder: false,
    }
    vi.mocked(api.put).mockResolvedValueOnce({ data: updatedSettings })

    const result = await settingsService.updateNotificationSettings(updatedSettings)

    expect(api.put).toHaveBeenCalledWith('/settings/notifications', updatedSettings)
    expect(result).toEqual(updatedSettings)
    expect(result.masterEmail).toBe(false)
  })
})
