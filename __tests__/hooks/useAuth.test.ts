import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '@/hooks/useAuth'
import { authStorage } from '@/lib/auth-storage'
import { logoutSession } from '@/lib/logout'

vi.mock('@/lib/auth-storage', () => ({
  authStorage: {
    getUserInfo: vi.fn(),
    clearToken: vi.fn(),
    clearUserInfo: vi.fn(),
  },
}))

vi.mock('@/lib/logout', () => ({
  logoutSession: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('useAuth hook (fallback mode without ReduxProvider)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('trả về isAuthenticated = false khi authStorage không có thông tin user', () => {
    vi.mocked(authStorage.getUserInfo).mockReturnValue(null)

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isInitializing).toBe(false)
  })

  it('trả về isAuthenticated = true và thông tin user khi authStorage có user', () => {
    const mockUser = {
      id: 1,
      email: 'teacher@mathclass.edu.vn',
      fullName: 'Thầy Giáo A',
      userRole: 'TEACHER',
    }
    vi.mocked(authStorage.getUserInfo).mockReturnValue(mockUser)

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('hàm logout xóa sạch token và gọi logoutSession', async () => {
    vi.mocked(authStorage.getUserInfo).mockReturnValue({ id: 1, email: 'user@mathclass.edu.vn' })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.logout()
    })

    expect(authStorage.clearToken).toHaveBeenCalled()
    expect(authStorage.clearUserInfo).toHaveBeenCalled()
    expect(logoutSession).toHaveBeenCalled()
  })
})
