import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ChatDockProvider, useChatDock } from '@/components/chat/ChatDockContext';

vi.mock('@/services/chatService', () => ({
  chatService: {
    getOnlineUsers: vi.fn().mockResolvedValue([10, 20]),
    getUnreadSummary: vi.fn().mockResolvedValue({
      hasGroupUnread: false,
      groupUnreadCount: 0,
      unreadStudentIds: [],
      studentUnreadCounts: {},
    }),
  },
}));

vi.mock('@stomp/stompjs', () => {
  return {
    Client: vi.fn().mockImplementation(function (this: any) {
      this.activate = vi.fn();
      this.deactivate = vi.fn();
      this.subscribe = vi.fn();
      this.publish = vi.fn();
      this.connected = true;
    }),
  };
});

describe('ChatDockContext - Context Provider Unit Tests', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ChatDockProvider classId={100} classCode="MATH101" currentUserId={20}>
      {children}
    </ChatDockProvider>
  );

  it('thêm mới cửa sổ chat khi gọi openChat', () => {
    const { result } = renderHook(() => useChatDock(), { wrapper });

    act(() => {
      result.current.openChat({
        id: 'student-30',
        type: 'DIRECT_STUDENT',
        title: 'Học sinh C',
        targetUserId: 30,
      });
    });

    expect(result.current.activeWindows.length).toBe(1);
    expect(result.current.activeWindows[0].id).toBe('student-30');
    expect(result.current.activeWindows[0].isMinimized).toBe(false);
  });

  it('thu nhỏ cửa sổ khi gọi minimizeChat', () => {
    const { result } = renderHook(() => useChatDock(), { wrapper });

    act(() => {
      result.current.openChat({
        id: 'student-30',
        type: 'DIRECT_STUDENT',
        title: 'Học sinh C',
        targetUserId: 30,
      });
    });

    act(() => {
      result.current.minimizeChat('student-30');
    });

    expect(result.current.activeWindows[0].isMinimized).toBe(true);
  });

  it('đảo trạng thái thu nhỏ/mở lại khi gọi toggleChat', () => {
    const { result } = renderHook(() => useChatDock(), { wrapper });

    act(() => {
      result.current.openChat({
        id: 'student-30',
        type: 'DIRECT_STUDENT',
        title: 'Học sinh C',
        targetUserId: 30,
      });
    });

    act(() => {
      result.current.toggleChat('student-30');
    });
    expect(result.current.activeWindows[0].isMinimized).toBe(true);

    act(() => {
      result.current.toggleChat('student-30');
    });
    expect(result.current.activeWindows[0].isMinimized).toBe(false);
  });

  it('tăng số tin nhắn chưa đọc khi gọi incrementUnread cho cửa sổ bị thu nhỏ', () => {
    const { result } = renderHook(() => useChatDock(), { wrapper });

    act(() => {
      result.current.openChat({
        id: 'student-30',
        type: 'DIRECT_STUDENT',
        title: 'Học sinh C',
        targetUserId: 30,
      });
      result.current.minimizeChat('student-30');
    });

    act(() => {
      result.current.incrementUnread('student-30');
    });

    expect(result.current.activeWindows[0].unreadCount).toBe(1);
  });
});
