export interface ChatMessageResponse {
  id: number;
  classId: number;
  studentId: number;
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
