'use client';

import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { baseURL } from '@/lib/axios';
import type { PublicPaymentConfigResponse, PaymentConfigResponse } from '@/types/payment';

export function GlobalPresenceTracker() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const hostUrl = baseURL.replace(/(\/api)?\/v\d+$/, '');
    const wsUrl = `${hostUrl}/ws-chat`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl, null, { withCredentials: true } as any),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Duy trì active STOMP subscription và phát event cho các component con cùng dùng
        client.subscribe('/topic/presence', (message) => {
          try {
            const payload = JSON.parse(message.body);
            if (typeof window !== 'undefined' && payload) {
              window.dispatchEvent(new CustomEvent('presence-change', { detail: payload }));
            }
          } catch (e) {
            // ignore parse error
          }
        });

        // Lắng nghe cập nhật trạng thái cổng VietQR tức thì từ Admin qua WebSocket
        client.subscribe('/topic/payment-config', (message) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload && typeof payload.isActive !== 'undefined') {
              // Cập nhật tức thời cache React Query cho toàn bộ client mà không cần reload trang
              queryClient.setQueryData<PublicPaymentConfigResponse | undefined>(
                ['credits', 'payment-config'],
                (old) => (old ? { ...old, ...payload } : old)
              );
              queryClient.setQueryData<PaymentConfigResponse | undefined>(
                ['admin', 'payment-config'],
                (old) => (old ? { ...old, isActive: payload.isActive } : old)
              );
              queryClient.invalidateQueries({ queryKey: ['credits', 'payment-config'] });
              queryClient.invalidateQueries({ queryKey: ['admin', 'payment-config'] });
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('payment-config-change', { detail: payload }));
              }
            }
          } catch (e) {
            // ignore parse error
          }
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [isAuthenticated, user?.id]);

  return null;
}
