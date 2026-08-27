'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useClassChat } from '@/hooks/useClassChat';
import { ChatMessageItem } from './ChatMessageItem';
import { useAuth } from '@/hooks/useAuth';
import { useChatDock } from './ChatDockContext';
import { Users } from 'lucide-react';

import { useClassroomChatUnread } from '@/hooks/useClassroomChatUnread';

interface ClassroomStudentChatWidgetProps {
  classId: number;
  classCode: string;
  studentId: number;
  teacherId?: number;
  teacherName: string;
  teacherAvatar?: string;
  initialOpen?: boolean;
  onUnreadChange?: (count: number) => void;
}

export function ClassroomStudentChatWidget({
  classId,
  classCode,
  studentId,
  teacherId,
  teacherName,
  teacherAvatar,
  initialOpen = false,
  onUnreadChange,
}: ClassroomStudentChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { openChat } = useChatDock();
  const { hasGroupUnread, groupUnreadCount } = useClassroomChatUnread(classCode);

  useEffect(() => {
    if (initialOpen) {
      setIsOpen(true);
    }
  }, [initialOpen]);

  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id || studentId;

  // Luôn kết nối STOMP và nạp tin nhắn/online status ngay từ khi load trang (enabled: true)
  const {
    messages,
    isLoadingHistory,
    onlineUserIds,
    sendMessage,
    markAsRead,
  } = useClassChat({
    classId,
    classCode,
    studentId,
    enabled: true,
    currentUserId,
  });

  const isTeacherOnline = teacherId ? onlineUserIds.has(teacherId) : false;

  // Đếm số lượng tin nhắn chưa đọc từ Giảng viên
  const unreadCount = useMemo(() => {
    return messages.filter((msg) => msg.senderId !== currentUserId && !msg.isRead).length;
  }, [messages, currentUserId]);

  useEffect(() => {
    if (onUnreadChange) {
      onUnreadChange(unreadCount);
    }
  }, [unreadCount, onUnreadChange]);

  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead, messages.length]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'GV';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      {/* Nút Floating Trigger Chat ở góc dưới bên phải */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group active:scale-95"
          title="Chat với Giảng viên"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
            {unreadCount > 0 ? (
              <span className="absolute -top-2.5 -right-2.5 min-w-[20px] h-5 px-1.5 bg-rose-500 text-white text-[11px] font-extrabold rounded-full flex items-center justify-center border-2 border-indigo-600 animate-bounce shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span
                className={`absolute -top-1 -right-1 w-2.5 h-2.5 border-2 border-indigo-600 rounded-full ${
                  isTeacherOnline ? 'bg-emerald-400' : 'bg-slate-400'
                }`}
              />
            )}
          </div>
          <span className="font-medium text-sm">Hỏi Giảng viên</span>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
              Tin nhắn mới
            </span>
          )}
        </button>
      )}

      {/* Cửa sổ Khung Chat riêng Popover */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-9 h-9 border border-white/20">
                  <AvatarImage src={teacherAvatar} alt={teacherName} />
                  <AvatarFallback className="bg-indigo-800 text-white font-bold text-xs">
                    {getInitials(teacherName)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-indigo-600 rounded-full ${
                    isTeacherOnline ? 'bg-emerald-400' : 'bg-slate-400'
                  }`}
                />
              </div>

              <div>
                <h4 className="font-semibold text-sm leading-tight line-clamp-1">{teacherName}</h4>
                <p className="text-[11px] flex items-center gap-1.5 font-medium mt-0.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isTeacherOnline ? 'bg-emerald-400' : 'bg-slate-400'
                    }`}
                  />
                  <span className={isTeacherOnline ? 'text-emerald-200' : 'text-indigo-200'}>
                    {isTeacherOnline ? 'Online' : 'Offline'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  openChat({
                    id: 'group',
                    type: 'CLASS_GROUP',
                    title: 'Chat Lớp',
                  })
                }
                className="text-xs text-white/90 hover:text-white hover:bg-white/10 rounded-lg px-2 py-1 flex items-center gap-1.5"
                title="Mở kênh Chat nhóm Lớp học"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Chat Lớp</span>
                {hasGroupUnread && (
                  <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                    {groupUnreadCount > 0 ? `${groupUnreadCount} mới` : 'Mới'}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-8 h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Body: Danh sách tin nhắn */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 bg-slate-50/50 dark:bg-slate-900/50">
            {isLoadingHistory && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Đang nạp tin nhắn...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                <MessageSquare className="w-10 h-10 stroke-1 mb-2 text-indigo-300" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Chưa có tin nhắn nào
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Hãy nhập câu hỏi để trao đổi trực tiếp với giảng viên nhé. Hỗ trợ công thức toán KaTeX (ví dụ: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">$E=mc^2$</code>)
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

          {/* Footer: Input soạn tin nhắn */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập tin nhắn (hỗ trợ $latex$)..."
                className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500 rounded-full px-4"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 h-10 w-9 h-9 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
