import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { chatService } from '@/services/chatService';
import { ChatMessageResponse } from '@/types/chat';
import { baseURL } from '@/lib/axios';

export interface UseClassChatProps {
  classId: number;
  classCode: string;
  studentId: number;
  enabled?: boolean;
}

export function useClassChat({ classId, classCode, studentId, enabled = true }: UseClassChatProps) {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const stompClientRef = useRef<Client | null>(null);

  // Fetch lịch sử tin nhắn
  const loadHistory = useCallback(async (reset: boolean = false) => {
    if (!classCode || !studentId) return;
    try {
      setIsLoadingHistory(true);
      const currentPage = reset ? 0 : page;
      const data = await chatService.getChatHistory(classCode, studentId, currentPage, 20);

      const content = data.content || [];
      // Data trả về xếp theo createdAt DESC -> Đảo lại để hiển thị tin cũ ở trên, mới ở dưới
      const sortedMessages = [...content].reverse();

      setMessages((prev) => (reset ? sortedMessages : [...sortedMessages, ...prev]));
      setHasMore(!data.last);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Lỗi khi nạp lịch sử tin nhắn:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [classCode, studentId, page]);

  // Đánh dấu đã đọc
  const markAsRead = useCallback(async () => {
    if (!classCode || !studentId) return;
    try {
      await chatService.markAsRead(classCode, studentId);
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, isRead: true }))
      );
    } catch (error) {
      console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
    }
  }, [classCode, studentId]);

  // Gửi tin nhắn qua STOMP WebSocket
  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || !stompClientRef.current || !stompClientRef.current.connected) {
      console.warn('WebSocket chưa kết nối hoặc nội dung rỗng');
      return;
    }

    const payload = {
      classId,
      studentId,
      content: content.trim(),
    };

    stompClientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload),
    });
  }, [classId, studentId]);

  // Kết nối WebSocket STOMP
  useEffect(() => {
    if (!enabled || !classId || !studentId) return;

    loadHistory(true);

    // Endpoint WebSocket ở Backend (chuyển đổi từ baseURL /api/v1 -> /ws-chat)
    const hostUrl = baseURL.replace(/\/api\/v\d+$/, '');
    const wsUrl = `${hostUrl}/ws-chat`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        setIsConnected(true);
        const destination = `/topic/classroom/${classId}/student/${studentId}`;

        client.subscribe(destination, (messageFrame) => {
          try {
            const newMsg: ChatMessageResponse = JSON.parse(messageFrame.body);
            setMessages((prev) => {
              // Tránh trùng lặp tin nhắn nếu id đã tồn tại
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } catch (e) {
            console.error('Lỗi parse tin nhắn STOMP:', e);
          }
        });
      },

      onDisconnect: () => {
        setIsConnected(false);
      },

      onStompError: (frame) => {
        console.error('Lỗi STOMP WebSocket:', frame.headers['message']);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [classId, studentId, enabled]);

  return {
    messages,
    isConnected,
    isLoadingHistory,
    hasMore,
    loadMore: () => loadHistory(false),
    sendMessage,
    markAsRead,
  };
}
