import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSignup } from '@/hooks/useSignup'
import { authService, SignupCredentials } from '@/services/authService'

vi.mock('@/services/authService', () => ({
  authService: {
    register: vi.fn(),
  },
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useSignup hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gọi authService.register với thông tin đăng ký', async () => {
    const credentials: SignupCredentials = {
      email: 'student@example.com',
      password: 'Password123!',
      fullName: 'Học Sinh Mới',
      phoneNumber: '0987654321',
      role: 'STUDENT',
    }
    const mockResponse = { message: 'Đăng ký tài khoản thành công' }
    vi.mocked(authService.register).mockResolvedValueOnce(mockResponse as any)

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignup(), {
      wrapper: createWrapper(queryClient),
    })

    let mutationResult: any
    await act(async () => {
      mutationResult = await result.current.mutateAsync(credentials)
    })

    expect(authService.register).toHaveBeenCalledWith(credentials)
    expect(mutationResult).toEqual(mockResponse)
  })
})
