'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ChatWindow, ChatType, ChatMessageResponse } from '@/types/chat';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { baseURL } from '@/lib/axios';
import { chatService } from '@/services/chatService';

interface ChatDockContextType {
  activeWindows: ChatWindow[];
  onlineUserIds: Set<number>;
  classId: number;
  classCode: string;
  currentUserId: number;
  openChat: (target: { id: string; type: ChatType; title: string; avatar?: string; targetUserId?: number }) => void;
  closeChat: (windowId: string) => void;
  minimizeChat: (windowId: string) => void;
  toggleChat: (windowId: string) => void;
  incrementUnread: (windowId: string) => void;
  isOnline: (userId?: number) => boolean;
  stompClient: Client | null;
}

const ChatDockContext = createContext<ChatDockContextType | undefined>(undefined);

export function ChatDockProvider({
  children,
  classId,
  classCode,
  currentUserId,
}: {
  children: React.ReactNode;
  classId: number;
  classCode: string;
  currentUserId: number;
}) {
  const [activeWindows, setActiveWindows] = useState<ChatWindow[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const stompClientRef = useRef<Client | null>(null);

  // Poll danh sách online users
  const fetchOnlineUsers = useCallback(async () => {
    if (!classCode) return;
    try {
      const ids = await chatService.getOnlineUsers(classCode);
      setOnlineUserIds(new Set(ids));
    } catch (e) {
      // ignore
    }
  }, [classCode]);

  useEffect(() => {
    if (!classCode) return;
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 8000);
    return () => clearInterval(interval);
  }, [classCode, fetchOnlineUsers]);

  // Khởi tạo WebSocket STOMP Client dùng chung cho Chat Dock
  useEffect(() => {
    if (!classId || !currentUserId) return;

    const hostUrl = baseURL.replace(/\/api\/v\d+$/, '');
    const wsUrl = `${hostUrl}/ws-chat`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        fetchOnlineUsers();

        // Tự động lắng nghe tin nhắn đến riêng của người dùng này để tự tạo tab thu nhỏ thông báo đỏ
        const userDirectTopic = `/topic/classroom/${classId}/student/${currentUserId}`;
        client.subscribe(userDirectTopic, (frame) => {
          try {
            const newMsg: ChatMessageResponse = JSON.parse(frame.body);
            if (newMsg.senderId === currentUserId) return; // Bỏ qua tin nhắn chính mình gửi

            setActiveWindows((prev) => {
              // Tìm cửa sổ hiện tại trùng targetUserId hoặc type DIRECT_TEACHER để chống nhân bản cửa sổ
              const existing = prev.find(
                (w) =>
                  (w.targetUserId && w.targetUserId === newMsg.senderId) ||
                  (newMsg.chatType === 'DIRECT_TEACHER' && (w.id === 'teacher' || w.type === 'DIRECT_TEACHER'))
              );

              if (existing) {
                if (existing.isMinimized) {
                  return prev.map((w) => (w.id === existing.id ? { ...w, unreadCount: w.unreadCount + 1 } : w));
                }
                return prev;
              } else {
                const windowId = newMsg.chatType === 'DIRECT_TEACHER' ? 'teacher' : `student-${newMsg.senderId}`;
                const newWin: ChatWindow = {
                  id: windowId,
                  type: newMsg.chatType === 'DIRECT_TEACHER' ? 'DIRECT_TEACHER' : 'DIRECT_STUDENT',
                  title: newMsg.senderName || 'Tin nhắn mới',
                  avatar: newMsg.senderAvatar,
                  targetUserId: newMsg.senderId,
                  isMinimized: true,
                  unreadCount: 1,
                };
                return [newWin, ...prev].slice(0, 3);
              }
            });
          } catch (e) {
            console.error('Lỗi parse STOMP message cho Dock context:', e);
          }
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [classId, currentUserId, fetchOnlineUsers]);

  const openChat = useCallback(
    (target: { id: string; type: ChatType; title: string; avatar?: string; targetUserId?: number }) => {
      setActiveWindows((prev) => {
        // Tìm xem cửa sổ chat với đối tượng này đã mở chưa (theo id, targetUserId hoặc ChatType)
        const existing = prev.find((w) => {
          if (w.id === target.id) return true;
          if (target.targetUserId && w.targetUserId && w.targetUserId === target.targetUserId) return true;
          if (target.type === 'DIRECT_TEACHER' && (w.id === 'teacher' || w.type === 'DIRECT_TEACHER')) return true;
          if (target.type === 'CLASS_GROUP' && w.type === 'CLASS_GROUP') return true;
          return false;
        });

        if (existing) {
          // Nếu đã tồn tại, tái sử dụng cửa sổ cũ, mở ra nếu đang thu nhỏ và đưa lên đầu mảng
          const updatedWindow: ChatWindow = {
            ...existing,
            title: target.title || existing.title,
            avatar: target.avatar || existing.avatar,
            targetUserId: target.targetUserId || existing.targetUserId,
            isMinimized: false,
            unreadCount: 0,
          };
          return [updatedWindow, ...prev.filter((w) => w.id !== existing.id)];
        }

        // Tạo cửa sổ mới nếu chưa có
        const newWindow: ChatWindow = {
          id: target.id,
          type: target.type,
          title: target.title,
          avatar: target.avatar,
          targetUserId: target.targetUserId,
          isMinimized: false,
          unreadCount: 0,
        };
        const updatedList = [newWindow, ...prev];
        return updatedList.slice(0, 3);
      });
    },
    []
  );

  const closeChat = useCallback((windowId: string) => {
    setActiveWindows((prev) => prev.filter((w) => w.id !== windowId));
  }, []);

  const minimizeChat = useCallback((windowId: string) => {
    setActiveWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, isMinimized: true } : w))
    );
  }, []);

  const toggleChat = useCallback((windowId: string) => {
    setActiveWindows((prev) =>
      prev.map((w) =>
        w.id === windowId ? { ...w, isMinimized: !w.isMinimized, unreadCount: w.isMinimized ? 0 : w.unreadCount } : w
      )
    );
  }, []);

  const incrementUnread = useCallback((windowId: string) => {
    setActiveWindows((prev) =>
      prev.map((w) =>
        w.id === windowId && w.isMinimized ? { ...w, unreadCount: w.unreadCount + 1 } : w
      )
    );
  }, []);

  const isOnline = useCallback(
    (userId?: number) => {
      if (!userId) return false;
      return onlineUserIds.has(userId);
    },
    [onlineUserIds]
  );

  return (
    <ChatDockContext.Provider
      value={{
        activeWindows,
        onlineUserIds,
        classId,
        classCode,
        currentUserId,
        openChat,
        closeChat,
        minimizeChat,
        toggleChat,
        incrementUnread,
        isOnline,
        stompClient: stompClientRef.current,
      }}
    >
      {children}
    </ChatDockContext.Provider>
  );
}

export function useChatDock() {
  const context = useContext(ChatDockContext);
  if (!context) {
    throw new Error('useChatDock must be used within a ChatDockProvider');
  }
  return context;
}
