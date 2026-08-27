import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/lib/axios';
import { chatService } from '@/services/chatService';

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('chatService - Unread Summary & Group Unread Count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getUnreadSummary gọi API GET và map chính xác groupUnreadCount, hasGroupUnread và studentUnreadCounts', async () => {
    const mockApiResponse = {
      data: {
        data: {
          hasGroupUnread: true,
          groupUnreadCount: 5,
          unreadStudentIds: [20, 30],
          studentUnreadCounts: {
            20: 3,
            30: 1,
          },
        },
      },
    };

    (api.get as any).mockResolvedValue(mockApiResponse);

    const result = await chatService.getUnreadSummary('MATH101');

    expect(api.get).toHaveBeenCalledWith('/classrooms/MATH101/chat/unread-summary');
    expect(result).toEqual({
      hasGroupUnread: true,
      groupUnreadCount: 5,
      unreadStudentIds: [20, 30],
      studentUnreadCounts: {
        20: 3,
        30: 1,
      },
    });
  });

  it('getUnreadSummary xử lý dữ liệu mặc định khi server trả về rỗng', async () => {
    (api.get as any).mockResolvedValue({ data: {} });

    const result = await chatService.getUnreadSummary('MATH101');

    expect(result).toEqual({
      hasGroupUnread: false,
      groupUnreadCount: 0,
      unreadStudentIds: [],
      studentUnreadCounts: {},
    });
  });

  it('getGroupChatHistory gọi API GET /classrooms/{classCode}/chat/group/messages với params page và size', async () => {
    const mockPageRes = {
      content: [{ id: 1, content: 'Chat nhóm', chatType: 'CLASS_GROUP' }],
      pageNumber: 0,
      pageSize: 20,
      totalElements: 1,
      totalPages: 1,
      last: true,
    };
    (api.get as any).mockResolvedValue({ data: { result: mockPageRes } });

    const result = await chatService.getGroupChatHistory('MATH101', 0, 20);

    expect(api.get).toHaveBeenCalledWith('/classrooms/MATH101/chat/group/messages', {
      params: { page: 0, size: 20 },
    });
    expect(result).toEqual(mockPageRes);
  });

  it('getDirectChatHistory gọi API GET /classrooms/{classCode}/chat/direct/{otherUserId}/messages với params', async () => {
    const mockPageRes = {
      content: [{ id: 2, content: 'Chat 1-1', chatType: 'DIRECT_STUDENT' }],
      pageNumber: 0,
      pageSize: 20,
      totalElements: 1,
      totalPages: 1,
      last: true,
    };
    (api.get as any).mockResolvedValue({ data: { result: mockPageRes } });

    const result = await chatService.getDirectChatHistory('MATH101', 30, 0, 20);

    expect(api.get).toHaveBeenCalledWith('/classrooms/MATH101/chat/direct/30/messages', {
      params: { page: 0, size: 20 },
    });
    expect(result).toEqual(mockPageRes);
  });

  it('markGroupAsRead gọi API PUT /classrooms/{classCode}/chat/group/read', async () => {
    (api.put as any).mockResolvedValue({ data: { success: true } });

    await chatService.markGroupAsRead('MATH101');

    expect(api.put).toHaveBeenCalledWith('/classrooms/MATH101/chat/group/read');
  });
});
