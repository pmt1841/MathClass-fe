import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLogin } from '@/hooks/useLogin'
import { authService, LoginResponse } from '@/services/authService'
import { authStorage } from '@/lib/auth-storage'
import { logoutSession } from '@/lib/logout'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/lib/redux/hooks'
import { useQueryClient } from '@tanstack/react-query'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/lib/redux/hooks', () => ({
  useAppDispatch: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
}))

vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}))

vi.mock('@/lib/auth-storage', () => ({
  authStorage: {
    setToken: vi.fn(),
    setUserInfo: vi.fn(),
  },
}))

vi.mock('@/lib/logout', () => ({
  logoutSession: vi.fn(),
}))

describe('useLogin hook', () => {
  const mockPush = vi.fn()
  const mockDispatch = vi.fn()
  const mockClearQueryClient = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
    vi.mocked(useAppDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useQueryClient).mockReturnValue({ clear: mockClearQueryClient } as any)
  })

  it('đăng nhập thành công với vai trò STUDENT - điều hướng sang /home và lưu session', async () => {
    const mockLoginRes: LoginResponse = {
      id: 1,
      email: 'student@example.com',
      fullName: 'Học Sinh A',
      role: 'STUDENT',
      token: 'access-token-123',
    }
    vi.mocked(authService.login).mockResolvedValueOnce(mockLoginRes)

    const { result } = renderHook(() => useLogin())

    let success: any
    await act(async () => {
      success = await result.current.login(
        { email: 'student@example.com', password: 'password' },
        false
      )
    })

    expect(success).toBe(true)
    expect(mockClearQueryClient).toHaveBeenCalled()
    expect(authStorage.setToken).toHaveBeenCalledWith('', 'STUDENT', false)
    expect(authStorage.setUserInfo).toHaveBeenCalledWith(mockLoginRes, false)
    expect(mockDispatch).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/home')
  })

  it('đăng nhập thành công với vai trò ADMIN - điều hướng sang /admin', async () => {
    const mockLoginRes: LoginResponse = {
      id: 99,
      email: 'admin@example.com',
      fullName: 'Quản Trị Viên',
      role: 'ADMIN',
    }
    vi.mocked(authService.login).mockResolvedValueOnce(mockLoginRes)

    const { result } = renderHook(() => useLogin())

    await act(async () => {
      await result.current.login(
        { email: 'admin@example.com', password: 'adminpassword' },
        true
      )
    })

    expect(mockPush).toHaveBeenCalledWith('/admin')
  })

  it('trả về TwoFactorState khi tài khoản yêu cầu xác thực 2 bước 2FA', async () => {
    const mock2faRes: LoginResponse = {
      id: 2,
      email: 'teacher@example.com',
      is2faRequired: true,
      isSetupRequired: false,
      preAuthToken: 'pre-auth-token-xyz',
      message: 'Vui lòng nhập mã xác thực Google Authenticator',
    }
    vi.mocked(authService.login).mockResolvedValueOnce(mock2faRes)

    const { result } = renderHook(() => useLogin())

    let loginResult: any
    await act(async () => {
      loginResult = await result.current.login(
        { email: 'teacher@example.com', password: 'password' },
        false
      )
    })

    expect(loginResult).toEqual({
      is2faRequired: true,
      isSetupRequired: false,
      preAuthToken: 'pre-auth-token-xyz',
      message: 'Vui lòng nhập mã xác thực Google Authenticator',
      email: 'teacher@example.com',
      rememberMe: false,
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('từ chối đăng nhập khi vai trò tài khoản không khớp với expectedRole', async () => {
    const mockLoginRes: LoginResponse = {
      id: 3,
      email: 'student@example.com',
      role: 'STUDENT',
    }
    vi.mocked(authService.login).mockResolvedValueOnce(mockLoginRes)

    const { result } = renderHook(() => useLogin())

    let loginResult: any
    await act(async () => {
      loginResult = await result.current.login(
        { email: 'student@example.com', password: 'password' },
        false,
        'TEACHER' // Mong đợi TEACHER nhưng là STUDENT
      )
    })

    expect(loginResult).toBe(false)
    expect(logoutSession).toHaveBeenCalled()
    expect(result.current.loginError).toContain('Tài khoản này không có quyền truy cập')
  })

  it('xử lý lỗi đăng nhập sai tài khoản/mật khẩu và hiển thị message từ API', async () => {
    const mockError = {
      response: {
        data: { message: 'Tài khoản hoặc mật khẩu không chính xác.' },
      },
    }
    vi.mocked(authService.login).mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useLogin())

    let loginResult: any
    await act(async () => {
      loginResult = await result.current.login(
        { email: 'wrong@example.com', password: 'wrong' },
        false
      )
    })

    expect(loginResult).toBe(false)
    expect(result.current.loginError).toBe('Tài khoản hoặc mật khẩu không chính xác.')
  })

  it('xử lý lỗi khi mất kết nối máy chủ mạng', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(new Error('Network Error'))

    const { result } = renderHook(() => useLogin())

    let loginResult: any
    await act(async () => {
      loginResult = await result.current.login(
        { email: 'user@example.com', password: 'password' },
        false
      )
    })

    expect(loginResult).toBe(false)
    expect(result.current.loginError).toBe('Không thể kết nối máy chủ. Vui lòng thử lại sau.')
  })
})
