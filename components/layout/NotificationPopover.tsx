'use client'

import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchEventSource } from '@microsoft/fetch-event-source'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { NotificationResponse } from '@/types/notification'
import { notificationService } from '@/services/notificationService'
import Link from 'next/link'
import { formatDistanceToNowSafe } from '@/lib/utils'
import { baseURL } from '@/lib/axios'

export function NotificationPopover() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const isPendingFetch = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
  })

  const {
    data: notificationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: ({ pageParam = 0 }) => notificationService.getNotifications(pageParam, 7),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length
      return nextPage < lastPage.totalPages ? nextPage : undefined
    },
    enabled: isOpen,
    staleTime: 0,
  })

  const triggerFetchNextPage = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || isPendingFetch.current) return

    isPendingFetch.current = true
    setIsLoadingMore(true)

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      try {
        await fetchNextPage()
      } finally {
        setIsLoadingMore(false)
        isPendingFetch.current = false
      }
    }, 500)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Reset infinite query back to page 0 whenever popover opens (Jira-style reload on open)
  useEffect(() => {
    if (isOpen) {
      queryClient.resetQueries({ queryKey: ['notifications', 'list'] })
    }
  }, [isOpen, queryClient])

  const triggerFetchNextPageRef = useRef(triggerFetchNextPage)
  useEffect(() => {
    triggerFetchNextPageRef.current = triggerFetchNextPage
  }, [triggerFetchNextPage])

  useEffect(() => {
    if (!isOpen || !hasNextPage) return

    const sentinel = loadMoreRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          triggerFetchNextPageRef.current()
        }
      },
      {
        root: viewportRef.current,
        threshold: 0.1,
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [isOpen, hasNextPage])

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // SSE logic
  useEffect(() => {
    const controller = new AbortController()
    const streamUrl = `${baseURL}/notifications/stream`

    fetchEventSource(streamUrl, {
      method: 'GET',
      credentials: 'include', // Automatically send HttpOnly cookie
      signal: controller.signal,
      openWhenHidden: true,
      onopen(response) {
        if (response.ok) {
          console.log('SSE connection opened successfully');
        } else {
          console.error('SSE connection failed with status:', response.status);
        }
        return Promise.resolve();
      },
      onmessage(ev) {
        console.log('SSE Message received:', ev.event, ev.data);
        if (ev.event === 'NOTIFICATION') {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
      },
      onerror(err) {
        console.error('SSE Error:', err)
      },
      onclose() {
        console.log('SSE connection closed');
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
  const notifications = notificationsData?.pages.flatMap((page) => page.content) || []

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex min-w-[20px] h-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-background">
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
        <ScrollArea className="h-[400px]" viewportRef={viewportRef}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground min-h-[300px]">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-xs">Đang tải thông báo...</p>
            </div>
          ) : notifications.length === 0 ? (
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
                    {formatDistanceToNowSafe(n.createdAt, { addSuffix: true })}
                  </span>
                </div>
              ))}

              <div ref={loadMoreRef} className="py-2 text-center min-h-[36px] flex items-center justify-center">
                {(isFetchingNextPage || isLoadingMore) ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1 border-t w-full">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Đang tải thêm...</span>
                  </div>
                ) : !hasNextPage && notifications.length > 0 ? (
                  <p className="text-[11px] text-muted-foreground/60 py-1">
                    Đã hiển thị tất cả thông báo
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

