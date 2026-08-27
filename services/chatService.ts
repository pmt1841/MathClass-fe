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

export interface ClassroomChatUnreadSummary {
  hasGroupUnread: boolean;
  groupUnreadCount: number;
  unreadStudentIds: number[];
  studentUnreadCounts: Record<number, number>;
}

export const chatService = {
  getChatHistory: async (
    classCode: string,
    studentId?: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ChatMessageResponse>> => {
    const response = await api.get(`/classrooms/${classCode}/chat/messages`, {
      params: { studentId, page, size },
    });
    return response.data?.result || response.data;
  },

  markAsRead: async (classCode: string, studentId?: number): Promise<void> => {
    await api.put(`/classrooms/${classCode}/chat/messages/read`, null, {
      params: { studentId },
    });
  },

  getOnlineUsers: async (classCode: string): Promise<number[]> => {
    const response = await api.get(`/classrooms/${classCode}/chat/online-users`);
    const data = response.data?.result || response.data || [];
    return Array.from(data);
  },

  getUnreadStudentIds: async (classCode: string): Promise<number[]> => {
    const response = await api.get(`/classrooms/${classCode}/chat/unread-students`);
    const data = response.data?.result || response.data || [];
    return Array.from(data);
  },

  getGroupChatHistory: async (
    classCode: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ChatMessageResponse>> => {
    const response = await api.get(`/classrooms/${classCode}/chat/group/messages`, {
      params: { page, size },
    });
    return response.data?.result || response.data;
  },

  getDirectChatHistory: async (
    classCode: string,
    otherUserId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ChatMessageResponse>> => {
    const response = await api.get(`/classrooms/${classCode}/chat/direct/${otherUserId}/messages`, {
      params: { page, size },
    });
    return response.data?.result || response.data;
  },

  markDirectAsRead: async (classCode: string, otherUserId: number): Promise<void> => {
    await api.put(`/classrooms/${classCode}/chat/direct/${otherUserId}/read`);
  },

  markGroupAsRead: async (classCode: string): Promise<void> => {
    await api.put(`/classrooms/${classCode}/chat/group/read`);
  },

  getUnreadClassIds: async (): Promise<number[]> => {
    const response = await api.get('/classrooms/unread-chat-class-ids');
    const data = response.data?.result || response.data || [];
    return Array.from(data);
  },

  getUnreadSummary: async (classCode: string): Promise<ClassroomChatUnreadSummary> => {
    const response = await api.get(`/classrooms/${classCode}/chat/unread-summary`);
    const data = response.data?.result || response.data || {};
    return {
      hasGroupUnread: Boolean(data.hasGroupUnread),
      groupUnreadCount: Number(data.groupUnreadCount || 0),
      unreadStudentIds: Array.from(data.unreadStudentIds || []),
      studentUnreadCounts: data.studentUnreadCounts || {},
    };
  },
};


