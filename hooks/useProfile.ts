import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/lib/api/profile'
import { UpdateProfileRequest, UserResponse } from '@/types'
import { toast } from 'sonner'

export const PROFILE_QUERY_KEY = ['profile']

export const useProfile = () => {
  return useQuery<UserResponse>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileApi.getProfile
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.updateProfile(data),
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, data)
      toast.success('Cập nhật hồ sơ thành công')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Có lỗi xảy ra khi cập nhật hồ sơ'
      toast.error(message)
    }
  })
}

export const useUploadAvatar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: (avatarUrl) => {
      // Optimistically update the avatar in the current profile data
      queryClient.setQueryData<UserResponse | undefined>(PROFILE_QUERY_KEY, (oldData) => {
        if (!oldData) return undefined
        return {
          ...oldData,
          avatarUrl
        }
      })
      toast.success('Tải ảnh đại diện thành công')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Có lỗi xảy ra khi tải ảnh lên'
      toast.error(message)
    }
  })
}
