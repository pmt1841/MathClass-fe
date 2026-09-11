import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { profileService } from '@/services/profileService'
import {
  UserResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  SetPasswordRequest,
} from '@/types'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getProfile - gọi GET /users/me và trả về thông tin cá nhân của người dùng', async () => {
    const mockUser: UserResponse = {
      id: 1,
      email: 'user1@example.com',
      fullName: 'Trần Văn B',
      phoneNumber: '0123456789',
      role: 'STUDENT',
      isActive: true,
      avatarUrl: 'https://example.com/avatar.jpg',
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockUser })

    const result = await profileService.getProfile()

    expect(api.get).toHaveBeenCalledWith('/users/me')
    expect(result).toEqual(mockUser)
  })

  it('updateProfile - gọi PUT /users/me với payload cập nhật thông tin cá nhân', async () => {
    const updatePayload: UpdateProfileRequest = {
      fullName: 'Trần Văn B Modified',
      phoneNumber: '0987654321',
    }
    const mockUpdatedUser: UserResponse = {
      id: 1,
      email: 'user1@example.com',
      fullName: 'Trần Văn B Modified',
      phoneNumber: '0987654321',
      role: 'STUDENT',
      isActive: true,
    }
    vi.mocked(api.put).mockResolvedValueOnce({ data: mockUpdatedUser })

    const result = await profileService.updateProfile(updatePayload)

    expect(api.put).toHaveBeenCalledWith('/users/me', updatePayload)
    expect(result).toEqual(mockUpdatedUser)
  })

  it('uploadAvatar - gọi POST /users/me/avatar với FormData và multipart/form-data header', async () => {
    const mockFile = new File(['dummy-image-bytes'], 'avatar.png', { type: 'image/png' })
    const mockResponse = { avatarUrl: 'https://storage.example.com/avatars/new-avatar.png' }

    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse })

    const result = await profileService.uploadAvatar(mockFile)

    expect(api.post).toHaveBeenCalledWith(
      '/users/me/avatar',
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    )
    expect(result).toBe('https://storage.example.com/avatars/new-avatar.png')
  })

  it('changePassword - gọi PUT /users/me/password với mật khẩu cũ và mới', async () => {
    const payload: ChangePasswordRequest = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword456',
      confirmPassword: 'newPassword456',
    }
    const mockResponse = { message: 'Đổi mật khẩu thành công' }
    vi.mocked(api.put).mockResolvedValueOnce({ data: mockResponse })

    const result = await profileService.changePassword(payload)

    expect(api.put).toHaveBeenCalledWith('/users/me/password', payload)
    expect(result).toEqual(mockResponse)
  })

  it('sendSetPasswordOtp - gọi POST /users/me/set-password/send-otp gửi OTP thiết lập mật khẩu', async () => {
    const mockResponse = { message: 'OTP đã được gửi tới email của bạn' }
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse })

    const result = await profileService.sendSetPasswordOtp()

    expect(api.post).toHaveBeenCalledWith('/users/me/set-password/send-otp')
    expect(result).toEqual(mockResponse)
  })

  it('setPassword - gọi PUT /users/me/set-password thiết lập mật khẩu lần đầu với OTP', async () => {
    const payload: SetPasswordRequest = {
      otpCode: '123456',
      newPassword: 'newPassword456',
      confirmPassword: 'newPassword456',
    }
    const mockResponse = { message: 'Thiết lập mật khẩu thành công' }
    vi.mocked(api.put).mockResolvedValueOnce({ data: mockResponse })

    const result = await profileService.setPassword(payload)

    expect(api.put).toHaveBeenCalledWith('/users/me/set-password', payload)
    expect(result).toEqual(mockResponse)
  })
})
