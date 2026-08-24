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
  isTeacher?: boolean;
  enabled?: boolean;
}

export function useClassChat({ classId, classCode, studentId, isTeacher = false, enabled = true }: UseClassChatProps) {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const [unreadStudentIds, setUnreadStudentIds] = useState<Set<number>>(new Set());

  const stompClientRef = useRef<Client | null>(null);

  // Lấy danh sách user online
  const fetchOnlineUsers = useCallback(async () => {
    if (!classCode) return;
    try {
      const ids = await chatService.getOnlineUsers(classCode);
      setOnlineUserIds(new Set(ids));
    } catch (e) {
      // ignore
    }
  }, [classCode]);

  // Lấy danh sách học sinh có tin nhắn chưa đọc (cho giảng viên)
  const fetchUnreadStudentIds = useCallback(async () => {
    if (!classCode || !isTeacher) return;
    try {
      const ids = await chatService.getUnreadStudentIds(classCode);
      setUnreadStudentIds(new Set(ids));
    } catch (e) {
      // ignore
    }
  }, [classCode, isTeacher]);

  useEffect(() => {
    if (!enabled || !classCode) return;
    fetchOnlineUsers();
    if (isTeacher) {
      fetchUnreadStudentIds();
    }
    const interval = setInterval(() => {
      fetchOnlineUsers();
      if (isTeacher) {
        fetchUnreadStudentIds();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [enabled, classCode, isTeacher, fetchOnlineUsers, fetchUnreadStudentIds]);

  // Fetch lịch sử tin nhắn
  const loadHistory = useCallback(async (reset: boolean = false) => {
    if (!classCode || !studentId) return;
    try {
      setIsLoadingHistory(true);
      const fetchPage = reset ? 0 : page;
      const data = await chatService.getChatHistory(classCode, studentId, fetchPage, 20);

      const content = data.content || [];
      const sortedMessages = [...content].reverse();

      if (reset) {
        setMessages(sortedMessages);
        setPage(1);
      } else {
        setMessages((prev) => [...sortedMessages, ...prev]);
        setPage(fetchPage + 1);
      }
      setHasMore(!data.last);
    } catch (error) {
      console.error('Lỗi khi nạp lịch sử tin nhắn:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [classCode, studentId, page]);

  // Reset state và nạp lịch sử khi studentId hoặc classId thay đổi
  useEffect(() => {
    if (enabled && classCode && studentId) {
      setMessages([]);
      setPage(0);
      setHasMore(true);
      loadHistory(true);
    }
  }, [enabled, classCode, classId, studentId]);

  // Đánh dấu đã đọc
  const markAsRead = useCallback(async () => {
    if (!classCode || !studentId) return;
    try {
      await chatService.markAsRead(classCode, studentId);
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, isRead: true }))
      );
      setUnreadStudentIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    } catch (error) {
      console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
    }
  }, [classCode, studentId]);

  // Xóa thủ công cờ unread của 1 học sinh khi chọn học sinh đó
  const clearUnreadForStudent = useCallback((targetStudentId: number) => {
    setUnreadStudentIds((prev) => {
      if (!prev.has(targetStudentId)) return prev;
      const next = new Set(prev);
      next.delete(targetStudentId);
      return next;
    });
  }, []);

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

    const hostUrl = baseURL.replace(/\/api\/v\d+$/, '');
    const wsUrl = `${hostUrl}/ws-chat`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        setIsConnected(true);
        fetchOnlineUsers();

        // Topic 1: Lắng nghe cuộc trò chuyện hiện tại với học sinh này
        const destination = `/topic/classroom/${classId}/student/${studentId}`;
        client.subscribe(destination, (messageFrame) => {
          try {
            const newMsg: ChatMessageResponse = JSON.parse(messageFrame.body);
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } catch (e) {
            console.error('Lỗi parse tin nhắn STOMP:', e);
          }
        });

        // Topic 2: Dành cho Giảng viên nhận thông báo tin nhắn từ TẤT CẢ học sinh
        if (isTeacher) {
          const teacherDestination = `/topic/classroom/${classId}/teacher`;
          client.subscribe(teacherDestination, (messageFrame) => {
            try {
              const newMsg: ChatMessageResponse = JSON.parse(messageFrame.body);
              if (newMsg.studentId && newMsg.studentId !== studentId) {
                setUnreadStudentIds((prev) => new Set(prev).add(newMsg.studentId));
              }
            } catch (e) {
              console.error('Lỗi parse tin nhắn teacher topic:', e);
            }
          });
        }
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
  }, [classId, studentId, enabled, isTeacher, fetchOnlineUsers]);

  return {
    messages,
    isConnected,
    isLoadingHistory,
    hasMore,
    onlineUserIds,
    unreadStudentIds,
    clearUnreadForStudent,
    loadMore: () => loadHistory(false),
    sendMessage,
    markAsRead,
  };
}
