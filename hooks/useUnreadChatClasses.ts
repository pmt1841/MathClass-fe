'use client'

import { useQuery } from '@tanstack/react-query'
import { chatService } from '@/services/chatService'
import { useAuth } from '@/hooks/useAuth'

export function useUnreadChatClasses() {
  const { isAuthenticated } = useAuth()

  const { data: unreadClassIds = [], refetch } = useQuery({
    queryKey: ['unread-chat-class-ids'],
    queryFn: () => chatService.getUnreadClassIds(),
    enabled: isAuthenticated,
    refetchInterval: 8000,
    staleTime: 4000,
  })

  return {
    unreadClassIds,
    hasAnyUnread: unreadClassIds.length > 0,
    isUnreadClass: (classId: number) => unreadClassIds.includes(classId),
    refetch,
  }
}
