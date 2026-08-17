'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { setAuth, setInitializing, logoutSuccess } from '@/lib/redux/features/authSlice';
import api from '@/lib/axios';
import { logoutSession } from '@/lib/logout';
import { useQueryClient } from '@tanstack/react-query';
import { PermissionRevokedModal } from '@/components/auth/permission-revoked-modal';
import { authStorage } from '@/lib/auth-storage';
import { useAuthChannel, AuthEventPayload } from '@/hooks/useAuthChannel';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const prevUserIdRef = useRef<number | undefined>(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | undefined>();

  /*
   * TỰ ĐỘNG TẢI THÔNG TIN PROFILE:
   * Nếu người dùng bị Admin khóa (!isActive), API /users/me sẽ trả về lỗi ACCOUNT_LOCKED (403).
   * Tại đây ta bắt lỗi và dispatch logoutSuccess() để dọn dẹp Redux State, tránh việc trang bị kẹt loading vô tận.
   */
  const refreshProfile = useCallback(async () => {
    if (typeof window !== 'undefined' && !authStorage.isValidSession()) {
      await logoutSession();
      authStorage.clearToken();
      authStorage.clearUserInfo();
      dispatch(logoutSuccess());
      if (window.location.pathname !== '/' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return;
    }

    try {
      const response = await api.get('/users/me');
      dispatch(setAuth(response.data));
    } catch (error: any) {
      const isLocked =
        error?.response?.data?.code === 'ACCOUNT_LOCKED' ||
        (typeof error?.response?.data?.message === 'string' && error.response.data.message.includes('đã bị khóa'));

      if (isLocked) {
        dispatch(logoutSuccess());
      } else {
        dispatch(setInitializing(false));
      }
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

  // Lắng nghe sự kiện đồng bộ phiên từ các tab khác
  useAuthChannel(useCallback((payload: AuthEventPayload) => {
    if (payload.type === 'LOGIN' || payload.type === 'ACCOUNT_CHANGED') {
      refreshProfile();
    } else if (payload.type === 'LOGOUT' || payload.type === 'SESSION_EXPIRED') {
      authStorage.clearToken();
      authStorage.clearUserInfo();
      dispatch(logoutSuccess());
      queryClient.clear();
      if (window.location.pathname !== '/' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  }, [dispatch, queryClient, refreshProfile]));


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
