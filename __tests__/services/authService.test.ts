import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { authService } from '@/services/authService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login gọi POST /auth/login với credentials và trả về LoginResponse', async () => {
    const mockRes = {
      data: {
        id: 1,
        email: 'user@mathclass.edu.vn',
        fullName: 'Nguyễn Văn A',
        userRole: 'TEACHER',
        token: 'jwt-mock-token',
      },
    }
    vi.mocked(api.post).mockResolvedValueOnce(mockRes)

    const credentials = { email: 'user@mathclass.edu.vn', password: 'Password123' }
    const result = await authService.login(credentials)

    expect(api.post).toHaveBeenCalledWith('/auth/login', credentials)
    expect(result).toEqual(mockRes.data)
  })

  it('register chuẩn hóa NFC fullName và gọi POST /auth/register', async () => {
    const mockRes = { data: { message: 'Đăng ký thành công' } }
    vi.mocked(api.post).mockResolvedValueOnce(mockRes)

    const credentials = {
      fullName: 'Nguyễn Văn B',
      email: 'student@mathclass.edu.vn',
      phoneNumber: '0901234567',
      password: 'Password123',
      role: 'STUDENT',
    }
    const result = await authService.register(credentials)

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      ...credentials,
      fullName: 'Nguyễn Văn B'.normalize('NFC'),
    })
    expect(result).toEqual(mockRes.data)
  })

  it('googleAuth gọi POST /auth/google với credential và role', async () => {
    const mockRes = { data: { token: 'google-jwt-token', userRole: 'STUDENT' } }
    vi.mocked(api.post).mockResolvedValueOnce(mockRes)

    const credentials = { credential: 'mock-google-token', role: 'STUDENT' }
    const result = await authService.googleAuth(credentials)

    expect(api.post).toHaveBeenCalledWith('/auth/google', credentials)
    expect(result).toEqual(mockRes.data)
  })

  it('verifyEmail gọi GET /auth/verify?token=...', async () => {
    const mockRes = { data: { message: 'Xác thực email thành công' } }
    vi.mocked(api.get).mockResolvedValueOnce(mockRes)

    const result = await authService.verifyEmail('token123')

    expect(api.get).toHaveBeenCalledWith('/auth/verify?token=token123')
    expect(result).toEqual(mockRes.data)
  })

  it('forgotPassword gọi POST /auth/forgot-password với email', async () => {
    const mockRes = { data: { message: 'Đã gửi liên kết đặt lại mật khẩu' } }
    vi.mocked(api.post).mockResolvedValueOnce(mockRes)

    const result = await authService.forgotPassword('user@mathclass.edu.vn')

    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'user@mathclass.edu.vn' })
    expect(result).toEqual(mockRes.data)
  })

  it('resetPassword gọi POST /auth/reset-password với payload', async () => {
    const mockRes = { data: { message: 'Đặt lại mật khẩu thành công', role: 'TEACHER' } }
    vi.mocked(api.post).mockResolvedValueOnce(mockRes)

    const payload = { token: 'reset-token', newPassword: 'NewPassword123' }
    const result = await authService.resetPassword(payload)

    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', payload)
    expect(result).toEqual(mockRes.data)
  })

  it('initiate2faSetup gọi POST /auth/2fa/setup kèm Authorization header', async () => {
    const mockRes = {
      data: {
        secretKey: 'mock-secret',
        qrCodeDataUrl: 'data:image/png;base64,...',
        manualEntryKey: 'MOCKKEY',
      },
    }
    vi.mocked(api.post).mockResolvedValueOnce(mockRes)

    const result = await authService.initiate2faSetup('pre-auth-token-123')

    expect(api.post).toHaveBeenCalledWith(
      '/auth/2fa/setup',
      {},
      { headers: { Authorization: 'Bearer pre-auth-token-123' } }
    )
    expect(result).toEqual(mockRes.data)
  })

  it('confirm2faSetup gọi POST /auth/2fa/setup/confirm kèm payload và Authorization header', async () => {
    const mockRes = {
      data: {
        userInfo: { id: 1, email: 'admin@mathclass.edu.vn' },
        backupCodes: ['code1', 'code2'],
        message: 'Kích hoạt 2FA thành công',
      },
    }
    vi.mocked(api.post).mockResolvedValueOnce(mockRes)

    const payload = { code: '123456' }
    const result = await authService.confirm2faSetup(payload, 'pre-auth-token-123')

    expect(api.post).toHaveBeenCalledWith(
      '/auth/2fa/setup/confirm',
      payload,
      { headers: { Authorization: 'Bearer pre-auth-token-123' } }
    )
    expect(result).toEqual(mockRes.data)
  })

  it('verify2faLogin gọi POST /auth/2fa/verify kèm payload và Authorization header', async () => {
    const mockRes = {
      data: {
        id: 1,
        token: 'logged-in-jwt',
        userRole: 'ADMIN',
      },
    }
    vi.mocked(api.post).mockResolvedValueOnce(mockRes)

    const payload = { code: '654321', isBackupCode: false }
    const result = await authService.verify2faLogin(payload, 'pre-auth-token-123')

    expect(api.post).toHaveBeenCalledWith(
      '/auth/2fa/verify',
      payload,
      { headers: { Authorization: 'Bearer pre-auth-token-123' } }
    )
    expect(result).toEqual(mockRes.data)
  })
})
