'use client'

import { Bell, CheckCheck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { NotificationResponse } from '@/types/notification'
import { getNotifications, getUnreadCount, markAllAsRead, markAsRead } from '@/lib/api/notification'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

export function NotificationPopover() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60000,
  })

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => getNotifications(0, 20),
  })

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // SSE logic
  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) return

    const controller = new AbortController()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

    fetchEventSource(apiUrl + '/api/notifications/stream', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      signal: controller.signal,
      onmessage(ev) {
        if (ev.event === 'NOTIFICATION') {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
      },
      onerror(err) {
        console.error('SSE Error:', err)
      }
    })

    return () => {
      controller.abort()
    }
  }, [queryClient])

  const handleMarkAll = () => {
    markAllMutation.mutate()
  }

  const handleNotificationClick = (n: NotificationResponse) => {
    if (!n.read) {
      markReadMutation.mutate(n.id)
    }
    setIsOpen(false)
  }

  const unreadCount = unreadData?.count || 0
  const notifications = notificationsData?.content || []

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-primary">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-2 shadow-xl" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
          <h4 className="font-semibold text-sm">Thông báo</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:underline"
              onClick={handleMarkAll}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Đánh dấu đã đọc
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground min-h-[300px]">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`flex flex-col items-start gap-1 border-b px-4 py-3 hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5 border-l-2 border-l-primary' : 'opacity-70'}`}
                >
                  {n.link ? (
                    <Link href={n.link} onClick={() => handleNotificationClick(n)} className="w-full">
                      <p className={`text-sm ${!n.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {n.message}
                      </p>
                    </Link>
                  ) : (
                    <div onClick={() => handleNotificationClick(n)} className="w-full cursor-pointer">
                      <p className={`text-sm ${!n.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {n.message}
                      </p>
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
