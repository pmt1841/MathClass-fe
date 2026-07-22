'use client';

import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { setAuth, setInitializing } from '@/lib/redux/features/authSlice';
import api from '@/lib/axios';
import { useQueryClient } from '@tanstack/react-query';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const prevUserIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
      queryClient.clear();
    }
    prevUserIdRef.current = userId;
  }, [userId, queryClient]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.get('/users/profile');
        dispatch(setAuth(response.data));
      } catch (error) {
        // Lỗi 401 hoặc lỗi khác, xem như chưa đăng nhập
        dispatch(setInitializing(false));
      }
    };
    initAuth();
  }, [dispatch]);

  return <>{children}</>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}

