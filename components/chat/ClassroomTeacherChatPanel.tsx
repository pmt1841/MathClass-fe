'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MessageSquare, Send, User as UserIcon, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useClassChat } from '@/hooks/useClassChat';
import { ChatMessageItem } from './ChatMessageItem';
import { authStorage } from '@/lib/auth-storage';

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
}

export function ClassroomTeacherChatPanel({
  classId,
  classCode,
  students,
}: ClassroomTeacherChatPanelProps) {
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(
    students.length > 0 ? students[0] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = authStorage.getUserInfo();
  const currentUserId = currentUser?.id || 0;

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const {
    messages,
    isConnected,
    isLoadingHistory,
    sendMessage,
    markAsRead,
  } = useClassChat({
    classId,
    classCode,
    studentId: selectedStudent?.id || 0,
    enabled: !!selectedStudent,
  });

  useEffect(() => {
    if (selectedStudent) {
      markAsRead();
    }
  }, [selectedStudent, markAsRead, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedStudent) return;
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
      {/* Cột Trái: Danh sách Học sinh trong Lớp */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-2 px-1 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-indigo-600" /> Học sinh trong lớp ({students.length})
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="pl-9 h-9 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredStudents.length === 0 ? (
            <p className="text-xs text-center text-slate-400 py-6">Không tìm thấy học sinh nào</p>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = selectedStudent?.id === student.id;
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src={student.avatarUrl} alt={student.fullName} />
                    <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 text-xs font-bold">
                      {getInitials(student.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate leading-tight">{student.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Cột Phải: Khung Chat 1-1 với Học sinh được chọn */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {selectedStudent ? (
          <>
            {/* Header Khung Chat */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-slate-200 dark:border-slate-700">
                  <AvatarImage src={selectedStudent.avatarUrl} alt={selectedStudent.fullName} />
                  <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs">
                    {getInitials(selectedStudent.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {selectedStudent.fullName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    {isConnected ? 'Sẵn sàng trao đổi thời gian thực' : 'Đang thiết lập kết nối...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Tin Nhắn */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40 dark:bg-slate-900/40">
              {isLoadingHistory && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                  Đang nạp tin nhắn...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                  <MessageSquare className="w-12 h-12 stroke-1 mb-2 text-indigo-300" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Chưa có tin nhắn nào với {selectedStudent.fullName}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Nhập nội dung phản hồi bên dưới để trò chuyện trực tiếp với học sinh này.
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

            {/* Input Gửi Tin Nhắn */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Gửi phản hồi cho ${selectedStudent.fullName} (hỗ trợ công thức toán $latex$)...`}
                  className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-full px-5 h-10 focus-visible:ring-indigo-500"
                />
                <Button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 h-10 gap-2"
                >
                  <Send className="w-4 h-4" /> Gửi
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
            <MessageSquare className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
            Vui lòng chọn một học sinh trong danh sách bên trái để bắt đầu chat 1-1.
          </div>
        )}
      </div>
    </div>
  );
}
