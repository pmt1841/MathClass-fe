import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { notificationService } from '@/services/notificationService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getNotifications - gọi GET /notifications với page và size mặc định', async () => {
    const mockData = {
      content: [
        {
          id: 1,
          title: 'Bài tập mới',
          message: 'Bạn có bài tập mới được giao',
          isRead: false,
          createdAt: '2026-09-11T10:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData })

    const result = await notificationService.getNotifications()

    expect(api.get).toHaveBeenCalledWith('/notifications?page=0&size=7')
    expect(result).toEqual(mockData)
  })

  it('getNotifications - gọi GET /notifications với page và size tùy chỉnh', async () => {
    const mockData = { content: [], totalElements: 0, totalPages: 0 }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData })

    const result = await notificationService.getNotifications(2, 10)

    expect(api.get).toHaveBeenCalledWith('/notifications?page=2&size=10')
    expect(result).toEqual(mockData)
  })

  it('getUnreadCount - gọi GET /notifications/unread-count và trả về số lượng chưa đọc', async () => {
    const mockUnread = { count: 5 }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockUnread })

    const result = await notificationService.getUnreadCount()

    expect(api.get).toHaveBeenCalledWith('/notifications/unread-count')
    expect(result).toEqual(mockUnread)
    expect(result.count).toBe(5)
  })

  it('markAllAsRead - gọi PATCH /notifications/read-all', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: null })

    await notificationService.markAllAsRead()

    expect(api.patch).toHaveBeenCalledWith('/notifications/read-all')
  })

  it('markAsRead - gọi PATCH /notifications/:id/read đánh dấu 1 thông báo đã đọc', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: null })

    await notificationService.markAsRead(12)

    expect(api.patch).toHaveBeenCalledWith('/notifications/12/read')
  })
})
