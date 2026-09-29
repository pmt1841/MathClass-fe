'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChatWindow, ChatMessageResponse } from '@/types/chat';
import { useChatDock } from './ChatDockContext';
import { chatService } from '@/services/chatService';
import { ChatMessageItem } from './ChatMessageItem';
import { Send, Minus, X, MessageSquare, Users, GraduationCap, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n/i18n-context';

const PAGE_SIZE = 5; // Hiển thị 5 tin nhắn mỗi lần query để tối ưu hiệu năng

export function FloatingChatWindow({ window }: { window: ChatWindow }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { classId, classCode, currentUserId, closeChat, minimizeChat, toggleChat, isOnline, stompClient } =
    useChatDock();

  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isGroup = window.type === 'CLASS_GROUP';
  const isTeacher = window.type === 'DIRECT_TEACHER';
  const online = !isGroup && window.targetUserId ? isOnline(window.targetUserId) : false;

  const handleMarkRead = useCallback(async () => {
    if (!classCode || window.isMinimized) return;
    try {
      if (isGroup) {
        await chatService.markGroupAsRead(classCode);
      } else if (isTeacher) {
        await chatService.markAsRead(classCode, currentUserId);
      } else if (window.targetUserId) {
        await chatService.markDirectAsRead(classCode, window.targetUserId);
      }
      queryClient.invalidateQueries({ queryKey: ['classroom-chat-unread', classCode] });
      queryClient.invalidateQueries({ queryKey: ['unread-chat-classes'] });
    } catch (e) {
      // ignore
    }
  }, [classCode, isGroup, isTeacher, currentUserId, window.targetUserId, window.isMinimized, queryClient]);

  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        if (typeof scrollContainerRef.current.scrollTo === 'function') {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto',
          });
        } else {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }
    }, 60);
  }, []);

  const fetchMessages = useCallback(
    async (targetPage: number, isReset: boolean) => {
      if (!classCode) return;
      try {
        if (isReset) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        let data;
        if (isGroup) {
          data = await chatService.getGroupChatHistory(classCode, targetPage, PAGE_SIZE);
        } else if (isTeacher) {
          data = await chatService.getChatHistory(classCode, currentUserId, targetPage, PAGE_SIZE);
        } else if (window.targetUserId) {
          data = await chatService.getDirectChatHistory(classCode, window.targetUserId, targetPage, PAGE_SIZE);
        }

        if (data) {
          const content = data.content || [];
          const fetchedMessages = [...content].reverse();

          if (isReset) {
            setMessages(fetchedMessages);
            setPage(0);
            setHasMore(!data.last);
            setTimeout(() => scrollToBottom(false), 50);
          } else {
            const scrollContainer = scrollContainerRef.current;
            const previousScrollHeight = scrollContainer ? scrollContainer.scrollHeight : 0;

            setMessages((prev) => [...fetchedMessages, ...prev]);
            setPage(targetPage);
            setHasMore(!data.last);

            requestAnimationFrame(() => {
              if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight - previousScrollHeight;
              }
            });
          }
        }
      } catch (error) {
        console.error('Lỗi nạp lịch sử chat:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [classCode, isGroup, isTeacher, currentUserId, window.targetUserId]
  );

  useEffect(() => {
    fetchMessages(0, true);
    handleMarkRead();
  }, [fetchMessages, handleMarkRead]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || isLoadingMore || !hasMore) return;

    if (container.scrollTop === 0) {
      fetchMessages(page + 1, false);
    }
  };

  useEffect(() => {
    if (!stompClient || !stompClient.connected || !classId) return;

    let destination = '';
    if (isGroup) {
      destination = `/topic/classroom/${classId}/group`;
    } else if (isTeacher) {
      destination = `/topic/classroom/${classId}/student/${currentUserId}`;
    } else {
      destination = `/topic/classroom/${classId}/direct/${currentUserId}`;
    }

    const sub = stompClient.subscribe(destination, (frame) => {
      try {
        const newMsg: ChatMessageResponse = JSON.parse(frame.body);
        const isFromOthers = newMsg.senderId !== currentUserId;

        if (isGroup) {
          setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
          scrollToBottom(true);
          if (isFromOthers && !window.isMinimized) {
            handleMarkRead();
          }
        } else if (isTeacher) {
          setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
          scrollToBottom(true);
          if (isFromOthers && !window.isMinimized) {
            handleMarkRead();
          }
        } else {
          const isRelated =
            (newMsg.senderId === window.targetUserId && newMsg.recipientId === currentUserId) ||
            (newMsg.senderId === currentUserId && newMsg.recipientId === window.targetUserId);

          if (isRelated) {
            setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
            scrollToBottom(true);
            if (isFromOthers && !window.isMinimized) {
              handleMarkRead();
            }
          }
        }
      } catch (e) {
        console.error('Lỗi parse STOMP message:', e);
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, [stompClient, isGroup, isTeacher, classId, currentUserId, window.targetUserId, window.isMinimized, handleMarkRead]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !stompClient || !stompClient.connected) return;

    const content = inputText.trim();

    if (isGroup) {
      stompClient.publish({
        destination: '/app/chat.sendGroup',
        body: JSON.stringify({ classId, content }),
      });
    } else if (isTeacher) {
      stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({ classId, studentId: currentUserId, content }),
      });
    } else if (window.targetUserId) {
      stompClient.publish({
        destination: '/app/chat.sendDirect',
        body: JSON.stringify({ classId, recipientId: window.targetUserId, content }),
      });
    }

    setInputText('');
    handleMarkRead();
    scrollToBottom(true);
  };

  if (window.isMinimized) {
    const hasUnread = window.unreadCount > 0;

    return (
      <button
        onClick={() => {
          toggleChat(window.id);
          handleMarkRead();
        }}
        className={`relative h-10 px-3.5 flex items-center gap-2 text-white rounded-t-xl shadow-lg border border-b-0 transition-all active:scale-95 font-semibold text-xs ${
          hasUnread
            ? 'bg-rose-600 hover:bg-rose-700 border-rose-400 animate-bounce'
            : 'bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 border-indigo-500/30'
        }`}
      >
        {hasUnread && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md animate-pulse">
            {window.unreadCount}
          </span>
        )}

        {isGroup ? (
          <Users className="w-4 h-4 text-white" />
        ) : isTeacher ? (
          <GraduationCap className="w-4 h-4 text-white" />
        ) : (
          <div className="relative w-5 h-5 rounded-full overflow-hidden bg-indigo-400 flex-shrink-0">
            {window.avatar ? (
              <Image src={window.avatar} alt={window.title} fill className="object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] uppercase font-bold text-white">
                {window.title.charAt(0)}
              </div>
            )}
            {online && (
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white" />
            )}
          </div>
        )}
        <span className="max-w-[110px] truncate">{window.title}</span>
        {hasUnread && (
          <span className="bg-white text-rose-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">
            {window.unreadCount} {t('mới')}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      onClick={handleMarkRead}
      className="w-80 h-[440px] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {isGroup ? (
            <div className="p-1.5 bg-indigo-500/50 rounded-lg flex-shrink-0">
              <Users className="w-4 h-4 text-white" />
            </div>
          ) : isTeacher ? (
            <div className="p-1.5 bg-indigo-500/50 rounded-lg flex-shrink-0">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-indigo-400 border border-white/30 flex-shrink-0">
              {window.avatar ? (
                <Image src={window.avatar} alt={window.title} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-xs font-bold text-white">
                  {window.title.charAt(0)}
                </div>
              )}
              {online && (
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-white" />
              )}
            </div>
          )}
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold truncate text-white">{window.title}</h4>
            <p className="text-[10px] text-indigo-100 flex items-center gap-1">
              {isGroup ? t('Kênh chung Lớp học') : isTeacher ? t('Giảng viên phụ trách') : online ? `🟢 ${t('Trực tuyến')}` : `⚪ ${t('Ngoại tuyến')}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => minimizeChat(window.id)}
            className="p-1 hover:bg-white/20 rounded-md transition-colors text-white"
            title={t('Thu nhỏ')}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => closeChat(window.id)}
            className="p-1 hover:bg-white/20 rounded-md transition-colors text-white"
            title={t('Đóng')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body - Messages with Infinite Scroll on top */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 px-3 pt-3 pb-8 overflow-y-auto space-y-2.5 bg-gray-50/50 dark:bg-gray-950/50 text-xs"
      >
        {isLoadingMore && (
          <div className="flex items-center justify-center py-1.5 text-[11px] text-indigo-600 font-medium gap-1.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg">
            <Loader2 className="w-3 h-3 animate-spin" /> {t('Đang tải thêm 5 tin nhắn cũ hơn...')}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> {t('Đang tải 5 tin nhắn gần nhất...')}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-1 text-center p-4">
            <MessageSquare className="w-6 h-6 stroke-1 text-indigo-300 mb-1" />
            <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
              {t('Chưa có tin nhắn nào')}
            </p>
            <p className="text-[10px] text-gray-400">
              {t('Bắt đầu trao đổi! Hỗ trợ công thức Toán KaTeX ($E=mc^2$)')}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              isMe={msg.senderId === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer - Input Form */}
      <form onSubmit={handleSend} className="p-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('Nhập tin nhắn (hỗ trợ KaTeX $E=mc^2$)...')}
          className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-gray-100 outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
