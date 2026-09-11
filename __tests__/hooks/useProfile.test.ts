import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProfile, useUpdateProfile, useUploadAvatar, PROFILE_QUERY_KEY } from '@/hooks/useProfile'
import { profileService } from '@/services/profileService'
import { UserResponse, UpdateProfileRequest } from '@/types'
import { toast } from 'sonner'

vi.mock('@/services/profileService', () => ({
  profileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
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

describe('useProfile hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useProfile', () => {
    it('lấy thông tin hồ sơ và tính toán cờ isGoogleUser, isLocalUser', async () => {
      const mockUser: UserResponse = {
        id: 1,
        fullName: 'Nguyễn Văn A',
        email: 'a@example.com',
        phoneNumber: '0123456789',
        role: 'STUDENT',
        isActive: true,
        provider: 'GOOGLE',
      }
      vi.mocked(profileService.getProfile).mockResolvedValueOnce(mockUser)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(profileService.getProfile).toHaveBeenCalled()
      expect(result.current.data).toEqual(mockUser)
      expect(result.current.isGoogleUser).toBe(true)
      expect(result.current.isLocalUser).toBe(false)
    })
  })

  describe('useUpdateProfile', () => {
    it('cập nhật thông tin hồ sơ thành công và cập nhật cache queryData', async () => {
      const updateData: UpdateProfileRequest = {
        fullName: 'Nguyễn Văn B',
        phoneNumber: '0987654321',
      }
      const mockUpdatedUser: UserResponse = {
        id: 1,
        fullName: 'Nguyễn Văn B',
        email: 'b@example.com',
        phoneNumber: '0987654321',
        role: 'STUDENT',
        isActive: true,
      }
      vi.mocked(profileService.updateProfile).mockResolvedValueOnce(mockUpdatedUser)

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(queryClient),
      })

      await act(async () => {
        await result.current.mutateAsync(updateData)
      })

      expect(profileService.updateProfile).toHaveBeenCalledWith(updateData)
      expect(queryClient.getQueryData(PROFILE_QUERY_KEY)).toEqual(mockUpdatedUser)
      expect(toast.success).toHaveBeenCalledWith('Cập nhật hồ sơ thành công')
    })
  })

  describe('useUploadAvatar', () => {
    it('upload ảnh đại diện thành công và cập nhật avatarUrl vào cache', async () => {
      const initialUser: UserResponse = {
        id: 1,
        fullName: 'Nguyễn Văn A',
        email: 'a@example.com',
        phoneNumber: '0123456789',
        role: 'STUDENT',
        isActive: true,
        avatarUrl: 'https://storage.example.com/old.png',
      }
      const newAvatarUrl = 'https://storage.example.com/new.png'
      vi.mocked(profileService.uploadAvatar).mockResolvedValueOnce(newAvatarUrl)

      const queryClient = createTestQueryClient()
      queryClient.setQueryData(PROFILE_QUERY_KEY, initialUser)

      const { result } = renderHook(() => useUploadAvatar(), {
        wrapper: createWrapper(queryClient),
      })

      const mockFile = new File(['dummy'], 'avatar.png', { type: 'image/png' })
      await act(async () => {
        await result.current.mutateAsync(mockFile)
      })

      expect(profileService.uploadAvatar).toHaveBeenCalledWith(mockFile)
      const cached = queryClient.getQueryData<UserResponse>(PROFILE_QUERY_KEY)
      expect(cached?.avatarUrl).toBe(newAvatarUrl)
      expect(toast.success).toHaveBeenCalledWith('Tải ảnh đại diện thành công')
    })
  })
})
