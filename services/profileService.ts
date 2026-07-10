import api from '@/lib/axios'
import { UserResponse, UpdateProfileRequest } from '@/types'

export const profileService = {
  getProfile: async () => {
    const response = await api.get<UserResponse>('/users/profile')
    return response.data
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await api.put<UserResponse>('/users/profile', data)
    return response.data
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post<{ avatarUrl: string }>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.avatarUrl
  }
}
