import api from '@/lib/axios'
import { UserResponse, UpdateProfileRequest, ChangePasswordRequest, SetPasswordRequest, UpdateUserLanguageRequest } from '@/types'

export const profileService = {
  getProfile: async () => {
    const response = await api.get<UserResponse>('/users/me')
    return response.data
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await api.put<UserResponse>('/users/me', data)
    return response.data
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post<{ avatarUrl: string }>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.avatarUrl
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const response = await api.put<{ message: string }>('/users/me/password', data)
    return response.data
  },

  sendSetPasswordOtp: async () => {
    const response = await api.post<{ message: string }>('/users/me/set-password/send-otp')
    return response.data
  },

  setPassword: async (data: SetPasswordRequest) => {
    const response = await api.put<{ message: string }>('/users/me/set-password', data)
    return response.data
  },

  updateLanguage: async (data: UpdateUserLanguageRequest | string) => {
    const payload = typeof data === 'string' ? { language: data } : data
    const response = await api.patch<UserResponse>('/users/me/language', payload)
    return response.data
  }
}

