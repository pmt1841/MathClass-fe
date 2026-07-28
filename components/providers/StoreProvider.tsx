'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { setAuth, setInitializing } from '@/lib/redux/features/authSlice';
import api from '@/lib/axios';
import { useQueryClient } from '@tanstack/react-query';
import { PermissionRevokedModal } from '@/components/auth/permission-revoked-modal';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const prevUserIdRef = useRef<number | undefined>(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | undefined>();

  const refreshProfile = useCallback(async () => {
    try {
      const response = await api.get('/users/profile');
      dispatch(setAuth(response.data));
    } catch {
      dispatch(setInitializing(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
      queryClient.clear();
    }
    prevUserIdRef.current = userId;
  }, [userId, queryClient]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const handlePermissionRevoked = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      setModalMessage(customEvent.detail?.message || 'Tính năng không khả dụng cho tài khoản của bạn.');
      setModalOpen(true);
      refreshProfile();
    };

    const handleFocus = () => userId && refreshProfile();

    window.addEventListener('permission-revoked', handlePermissionRevoked);
    window.addEventListener('focus', handleFocus);

    const intervalId = userId ? setInterval(refreshProfile, 10000) : null;

    return () => {
      window.removeEventListener('permission-revoked', handlePermissionRevoked);
      window.removeEventListener('focus', handleFocus);
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshProfile, userId]);

  return (
    <>
      {children}
      <PermissionRevokedModal open={modalOpen} onOpenChange={setModalOpen} message={modalMessage} />
    </>
  );
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
