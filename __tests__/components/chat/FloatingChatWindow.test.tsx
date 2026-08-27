import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FloatingChatWindow } from '@/components/chat/FloatingChatWindow';
import { ChatMessageItem } from '@/components/chat/ChatMessageItem';
import { chatService } from '@/services/chatService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/services/chatService', () => ({
  chatService: {
    getGroupChatHistory: vi.fn(),
    getDirectChatHistory: vi.fn(),
    markGroupAsRead: vi.fn().mockResolvedValue(undefined),
    markDirectAsRead: vi.fn().mockResolvedValue(undefined),
    markAsRead: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/components/chat/ChatDockContext', () => ({
  useChatDock: () => ({
    classId: 100,
    classCode: 'MATH101',
    currentUserId: 20,
    closeChat: vi.fn(),
    minimizeChat: vi.fn(),
    toggleChat: vi.fn(),
    isOnline: vi.fn().mockReturnValue(true),
    stompClient: null,
  }),
}));

describe('FloatingChatWindow Component Tests', () => {
  const queryClient = new QueryClient();

  const mockWindow = {
    id: 'group',
    type: 'CLASS_GROUP' as const,
    title: 'Chat Lớp',
    unreadCount: 0,
    isMinimized: false,
  };

  const createMockMessages = (count: number, startId: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: startId + i,
      classId: 100,
      studentId: 20,
      senderId: 20,
      senderName: 'Học sinh A',
      content: `Tin nhắn thứ ${startId + i}`,
      isRead: true,
      createdAt: '2026-08-27T10:00:00Z',
    }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nạp 5 tin nhắn ban đầu khi mở khung chat', async () => {
    const page0Messages = createMockMessages(5, 1);
    (chatService.getGroupChatHistory as any).mockResolvedValue({
      content: page0Messages,
      last: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FloatingChatWindow window={mockWindow} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(chatService.getGroupChatHistory).toHaveBeenCalledWith('MATH101', 0, 5);
      expect(screen.getByText('Tin nhắn thứ 1')).toBeInTheDocument();
      expect(screen.getByText('Tin nhắn thứ 5')).toBeInTheDocument();
    });
  });

  it('cuộn lên đầu danh sách để tải tiếp 5 tin nhắn cũ (phân trang)', async () => {
    const page0Messages = createMockMessages(5, 6);
    const page1Messages = createMockMessages(5, 1);

    (chatService.getGroupChatHistory as any)
      .mockResolvedValueOnce({ content: page0Messages, last: false })
      .mockResolvedValueOnce({ content: page1Messages, last: true });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <FloatingChatWindow window={mockWindow} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Tin nhắn thứ 10')).toBeInTheDocument();
    });

    const scrollContainer = container.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 0, writable: true });
      fireEvent.scroll(scrollContainer);
    }

    await waitFor(() => {
      expect(chatService.getGroupChatHistory).toHaveBeenCalledWith('MATH101', 1, 5);
    });
  });

  it('render chính xác công thức toán KaTeX dạng $E = mc^2$ trong ChatMessageItem', () => {
    const katexMessage = {
      id: 99,
      classId: 100,
      studentId: 20,
      senderId: 20,
      senderName: 'Học sinh A',
      content: 'Công thức toán: $E = mc^2$',
      isRead: true,
      createdAt: '2026-08-27T10:00:00Z',
    };

    const { container } = render(<ChatMessageItem message={katexMessage} isMe={true} />);

    expect(screen.getByText(/Công thức toán:/i)).toBeInTheDocument();
    const katexSpan = container.querySelector('.katex');
    expect(katexSpan).toBeInTheDocument();
  });
});
