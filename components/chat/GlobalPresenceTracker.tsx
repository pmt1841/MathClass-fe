'use client';

import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '@/hooks/useAuth';
import { baseURL } from '@/lib/axios';

export function GlobalPresenceTracker() {
  const { isAuthenticated, user } = useAuth();
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
