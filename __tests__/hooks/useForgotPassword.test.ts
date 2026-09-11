import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useForgotPassword } from '@/hooks/useForgotPassword'
import { authService } from '@/services/authService'

vi.mock('@/services/authService', () => ({
  authService: {
    forgotPassword: vi.fn(),
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

describe('useForgotPassword hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gọi authService.forgotPassword và gửi email yêu cầu đặt lại mật khẩu', async () => {
    const mockResponse = { message: 'Mã xác nhận đã gửi tới email' }
    vi.mocked(authService.forgotPassword).mockResolvedValueOnce(mockResponse as any)

    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(queryClient),
    })

    let mutationResult: any
    await act(async () => {
      mutationResult = await result.current.mutateAsync('user@example.com')
    })

    expect(authService.forgotPassword).toHaveBeenCalledWith('user@example.com')
    expect(mutationResult).toEqual(mockResponse)
  })
})
