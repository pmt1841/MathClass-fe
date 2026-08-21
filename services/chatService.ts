import api from '@/lib/axios';
import { ChatMessageResponse } from '@/types/chat';

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const chatService = {
  getChatHistory: async (
    classCode: string,
    studentId?: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ChatMessageResponse>> => {
    const response = await api.get(`/classes/${classCode}/chat/messages`, {
      params: { studentId, page, size },
    });
    return response.data?.result || response.data;
  },

  markAsRead: async (classCode: string, studentId?: number): Promise<void> => {
    await api.put(`/classes/${classCode}/chat/messages/read`, null, {
      params: { studentId },
    });
  },
};
