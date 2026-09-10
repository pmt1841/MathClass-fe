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

    const hostUrl = baseURL.replace(/\/api\/v\d+$/, '');
    const wsUrl = `${hostUrl}/ws-chat`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl, null, { withCredentials: true } as any),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Duy trì active STOMP subscription
        client.subscribe('/topic/presence', () => {});
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
