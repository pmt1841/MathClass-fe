'use client'

import { useQuery } from '@tanstack/react-query'
import { chatService, ClassroomChatUnreadSummary } from '@/services/chatService'

export function useClassroomChatUnread(classCode: string) {
  const { data, refetch } = useQuery<ClassroomChatUnreadSummary>({
    queryKey: ['classroom-chat-unread', classCode],
    queryFn: () => chatService.getUnreadSummary(classCode),
    enabled: Boolean(classCode),
    refetchInterval: 6000,
    staleTime: 3000,
  })

  const hasGroupUnread = Boolean(data?.hasGroupUnread)
  const unreadStudentIds = data?.unreadStudentIds || []
  const studentUnreadCounts = data?.studentUnreadCounts || {}

  return {
    hasGroupUnread,
    unreadStudentIds,
    studentUnreadCounts,
    hasAnyStudentUnread: unreadStudentIds.length > 0,
    getStudentUnreadCount: (studentId: number): number => {
      if (!studentId) return 0
      return studentUnreadCounts[studentId] || 0
    },
    refetch,
  }
}
