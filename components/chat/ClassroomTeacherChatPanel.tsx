'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, MessageSquare, Send, Users, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useClassChat } from '@/hooks/useClassChat';
import { ChatMessageItem } from './ChatMessageItem';
import { useAuth } from '@/hooks/useAuth';
import { useClassroomChatUnread } from '@/hooks/useClassroomChatUnread';
import { chatService } from '@/services/chatService';
import { useI18n } from '@/lib/i18n/i18n-context';

export interface StudentInfo {
  id: number;
  fullName: string;
  email?: string;
  avatarUrl?: string;
}

interface ClassroomTeacherChatPanelProps {
  classId: number;
  classCode: string;
  students: StudentInfo[];
  initialStudentId?: number;
}

export function ClassroomTeacherChatPanel({
  classId,
  classCode,
  students,
  initialStudentId,
}: ClassroomTeacherChatPanelProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const {
    hasGroupUnread,
    groupUnreadCount,
    unreadStudentIds: unreadStudentIdsFromSummary,
    studentUnreadCounts,
  } = useClassroomChatUnread(classCode);

  const unreadStudentIdsSet = useMemo(
    () => new Set(unreadStudentIdsFromSummary),
    [unreadStudentIdsFromSummary]
  );

  const targetStudent = useMemo(() => {
    if (initialStudentId && students.length > 0) {
      const found = students.find((s) => s.id === initialStudentId);
      if (found) return found;
    }
    return students.length > 0 ? students[0] : null;
  }, [initialStudentId, students]);

  const [selectedMode, setSelectedMode] = useState<'GROUP' | 'STUDENT'>(
    initialStudentId ? 'STUDENT' : 'GROUP'
  );
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(targetStudent);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (targetStudent) {
      setSelectedStudent(targetStudent);
      if (initialStudentId) {
        setSelectedMode('STUDENT');
      }
    }
  }, [targetStudent, initialStudentId]);

  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id || 0;

  const {
    messages,
    isLoadingHistory,
    onlineUserIds,
    sendMessage,
  } = useClassChat({
    classId,
    classCode,
    studentId: selectedMode === 'STUDENT' && selectedStudent ? selectedStudent.id : 0,
    isGroupChat: selectedMode === 'GROUP',
    isTeacher: true,
    enabled: selectedMode === 'GROUP' || !!selectedStudent,
    currentUserId,
  });

  // Xử lý khi click chọn Chat Lớp (Kênh chung)
  const handleSelectGroup = async () => {
    setSelectedMode('GROUP');
    try {
      await chatService.markGroupAsRead(classCode);
      queryClient.invalidateQueries({ queryKey: ['classroom-chat-unread', classCode] });
      queryClient.invalidateQueries({ queryKey: ['unread-chat-classes'] });
    } catch (e) {
      // ignore
    }
  };

  // Xử lý khi click chọn Học sinh 1-1
  const handleSelectStudent = async (student: StudentInfo) => {
    setSelectedMode('STUDENT');
    setSelectedStudent(student);
    try {
      await chatService.markDirectAsRead(classCode, student.id);
      queryClient.invalidateQueries({ queryKey: ['classroom-chat-unread', classCode] });
      queryClient.invalidateQueries({ queryKey: ['unread-chat-classes'] });
    } catch (e) {
      // ignore
    }
  };

  // Lọc và Sắp xếp danh sách Học sinh: Có tin nhắn 1-1 chưa đọc & Online lên trước
  const sortedStudents = useMemo(() => {
    const filtered = students.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const aUnread = unreadStudentIdsSet.has(a.id);
      const bUnread = unreadStudentIdsSet.has(b.id);
      if (aUnread && !bUnread) return -1;
      if (!aUnread && bUnread) return 1;

      const aOnline = onlineUserIds.has(a.id);
      const bOnline = onlineUserIds.has(b.id);
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;

      return (a.fullName || '').localeCompare(b.fullName || '');
    });
  }, [students, searchQuery, onlineUserIds, unreadStudentIdsSet]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (selectedMode === 'STUDENT' && !selectedStudent) return;

    sendMessage(inputText);
    setInputText('');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'HS';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex h-[600px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Cột Trái: Mục Chat Lớp + Danh sách Học sinh trong Lớp */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-2">
          {/* Nút Chọn Chat Lớp Chung */}
          <button
            type="button"
            onClick={handleSelectGroup}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
              selectedMode === 'GROUP'
                ? 'bg-indigo-600 text-white font-bold shadow-md ring-2 ring-indigo-400/30'
                : 'bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-950 dark:text-indigo-200 border border-indigo-200/60'
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 relative ${
                selectedMode === 'GROUP' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              <Users className="w-5 h-5" />
              {hasGroupUnread && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold truncate">📢 {t('Chat Lớp (Kênh chung)')}</p>
                {hasGroupUnread && (
                  <span className="flex-shrink-0 text-[10px] font-extrabold text-white bg-rose-500 px-1.5 py-0.5 rounded-full animate-pulse shadow-xs">
                    {groupUnreadCount > 0 ? `${groupUnreadCount} ${t('mới')}` : t('Mới')}
                  </span>
                )}
              </div>
              <p
                className={`text-[10px] truncate ${
                  selectedMode === 'GROUP' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t('Trao đổi với tất cả học sinh')}
              </p>
            </div>
          </button>

          <h3 className="font-semibold text-xs text-slate-500 dark:text-slate-400 pt-1 px-1 flex items-center justify-between uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-indigo-600" /> {t('Trò chuyện 1-1')} ({students.length})
            </span>
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Tìm theo tên hoặc email...')}
              className="pl-9 h-9 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Danh sách học sinh có thể cuộn */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[460px]">
          {sortedStudents.length === 0 ? (
            <p className="text-xs text-center text-slate-400 py-6">{t('Không tìm thấy học sinh nào')}</p>
          ) : (
            sortedStudents.map((student) => {
              const isSelected = selectedMode === 'STUDENT' && selectedStudent?.id === student.id;
              const isOnline = onlineUserIds.has(student.id);
              const hasUnread = unreadStudentIdsSet.has(student.id);
              const unreadCount = studentUnreadCounts[student.id] || 0;

              return (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                    hasUnread
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 font-bold shadow-xs'
                      : isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium shadow-xs border border-indigo-200'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={student.avatarUrl} alt={student.fullName} />
                      <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 text-xs font-bold">
                        {getInitials(student.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Chấm trạng thái Online (Xanh) hoặc Offline (Xám) */}
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-slate-900 rounded-full ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs truncate leading-tight ${
                          hasUnread ? 'font-bold text-rose-900 dark:text-white' : 'font-semibold'
                        }`}
                      >
                        {student.fullName}
                      </p>
                      {hasUnread && (
                        <span className="flex-shrink-0 text-[10px] font-extrabold text-white bg-rose-500 px-1.5 py-0.5 rounded-full animate-pulse shadow-xs">
                          {unreadCount > 0 ? `${unreadCount} ${t('mới')}` : t('Mới')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-1">
                      <span
                        className={`text-[10px] font-medium flex items-center gap-1 ${
                          isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                      {hasUnread && (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          {t('Có tin nhắn chưa đọc')}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Cột Phải: Khung Chat Lớp (Chung) hoặc Khung Chat 1-1 */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {selectedMode === 'GROUP' ? (
          <>
            {/* Header Khung Chat Lớp */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-indigo-50/40 dark:bg-indigo-950/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    📢 {t('Chat Lớp chung')} ({classCode})
                  </h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    {t('Kênh trao đổi chung dành cho toàn bộ học sinh và giảng viên trong lớp')}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Tin Nhắn Chat Lớp */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-10 bg-slate-50/40 dark:bg-slate-900/40">
              {isLoadingHistory && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                  {t('Đang nạp tin nhắn chat lớp...')}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                  <MessageSquare className="w-12 h-12 stroke-1 mb-2 text-indigo-300" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t('Chưa có tin nhắn nào trong kênh Chat Lớp')}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {t('Nhập nội dung tin nhắn bên dưới để bắt đầu gửi thông báo hoặc trao đổi với toàn bộ học sinh.')}
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

            {/* Input Gửi Tin Nhắn Chat Lớp */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('Gửi tin nhắn chung cho cả lớp (hỗ trợ công thức toán $latex$)...')}
                  className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-full px-5 h-10 focus-visible:ring-indigo-500"
                />
                <Button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 h-10 gap-2"
                >
                  <Send className="w-4 h-4" /> {t('Gửi cả lớp')}
                </Button>
              </div>
            </form>
          </>
        ) : selectedStudent ? (
          <>
            {/* Header Khung Chat 1-1 với Học sinh */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10 border border-slate-200 dark:border-slate-700">
                    <AvatarImage src={selectedStudent.avatarUrl} alt={selectedStudent.fullName} />
                    <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs">
                      {getInitials(selectedStudent.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${
                      onlineUserIds.has(selectedStudent.id) ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {selectedStudent.fullName}
                  </h4>
                  <p className="text-xs flex items-center gap-1.5 font-medium">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        onlineUserIds.has(selectedStudent.id) ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span className={onlineUserIds.has(selectedStudent.id) ? 'text-emerald-600' : 'text-slate-400'}>
                      {onlineUserIds.has(selectedStudent.id) ? 'Online' : 'Offline'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Content Tin Nhắn 1-1 */}
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-10 bg-slate-50/40 dark:bg-slate-900/40">
              {isLoadingHistory && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                  {t('Đang nạp tin nhắn...')}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                  <MessageSquare className="w-12 h-12 stroke-1 mb-2 text-indigo-300" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t('Chưa có tin nhắn nào')} {selectedStudent.fullName}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {t('Nhập nội dung phản hồi bên dưới để trò chuyện trực tiếp với học sinh này.')}
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

            {/* Input Gửi Tin Nhắn 1-1 */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`${t('Gửi phản hồi cho')} ${selectedStudent.fullName} (${t('hỗ trợ công thức toán')} $latex$)...`}
                  className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-full px-5 h-10 focus-visible:ring-indigo-500"
                />
                <Button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 h-10 gap-2"
                >
                  <Send className="w-4 h-4" /> {t('Gửi')}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
            <MessageSquare className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
            {t('Vui lòng chọn kênh Chat Lớp hoặc chọn một học sinh trong danh sách để bắt đầu trò chuyện.')}
          </div>
        )}
      </div>
    </div>
  );
}
