'use client'

import React, { useEffect, useCallback } from 'react'

export type AuthEventType = 'LOGIN' | 'LOGOUT' | 'ACCOUNT_CHANGED' | 'SESSION_EXPIRED'

export interface AuthEventPayload {
  type: AuthEventType
  user?: any
  timestamp: number
}

const CHANNEL_NAME = 'mathclass_auth_channel'
const STORAGE_KEY = 'mathclass_auth_event'

export function useAuthChannel(onAuthEvent?: (payload: AuthEventPayload) => void) {
  const broadcastEvent = useCallback((type: AuthEventType, user?: any) => {
    if (typeof window === 'undefined') return

    const payload: AuthEventPayload = {
      type,
      user,
      timestamp: Date.now(),
    }

    // 1. Dùng BroadcastChannel (Ưu tiên)
    let hasBroadcast = false
    try {
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel(CHANNEL_NAME)
        channel.postMessage(payload)
        channel.close()
        hasBroadcast = true
      }
    } catch (e) {
      console.warn('BroadcastChannel failed, fallback to localStorage', e)
    }

    // 2. Fallback qua localStorage event (Chỉ kích hoạt khi không có BroadcastChannel)
    if (!hasBroadcast) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
        localStorage.removeItem(STORAGE_KEY) // Trigger signal tức thì và dọn dẹp rác ngay lập tức
      } catch (e) {
        // ignore
      }
    }
  }, [])

  const handlerRef = React.useRef(onAuthEvent)
  useEffect(() => {
    handlerRef.current = onAuthEvent
  }, [onAuthEvent])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePayload = (payload: AuthEventPayload) => {
      if (handlerRef.current) {
        handlerRef.current(payload)
      }
    }

    // 1. Lắng nghe BroadcastChannel
    let channel: BroadcastChannel | null = null
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME)
        channel.onmessage = (event: MessageEvent<AuthEventPayload>) => {
          if (event.data && event.data.type) {
            handlePayload(event.data)
          }
        }
      } catch (e) {
        console.warn('Failed to register BroadcastChannel listener', e)
      }
    }

    // 2. Lắng nghe Storage Event (Fallback)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const payload: AuthEventPayload = JSON.parse(event.newValue)
          handlePayload(payload)
        } catch (e) {
          // ignore
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      if (channel) {
        channel.close()
      }
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return { broadcastEvent }
}
