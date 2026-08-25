export type ChatType = 'CLASS_GROUP' | 'DIRECT_STUDENT' | 'DIRECT_TEACHER';

export interface ChatMessageResponse {
  id: number;
  classId: number;
  studentId?: number;
  recipientId?: number;
  chatType?: ChatType;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessageRequest {
  classId: number;
  studentId: number;
  content: string;
}

export interface GroupChatMessageRequest {
  classId: number;
  content: string;
}

export interface DirectChatMessageRequest {
  classId: number;
  recipientId: number;
  content: string;
}

export interface ChatWindow {
  id: string;
  type: ChatType;
  targetUserId?: number;
  title: string;
  avatar?: string;
  isMinimized?: boolean;
  unreadCount: number;
}
