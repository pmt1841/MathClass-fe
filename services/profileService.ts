import api from '@/lib/axios'
import { UserResponse, UpdateProfileRequest } from '@/types'

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
  }
}
