import api from '@/lib/axios'
import {
  StorageCleanupStatus,
  StorageCleanupRequest,
  StorageCleanupResponse,
  UpdateStorageCleanupConfigRequest,
} from '@/types/storage'

export const storageAdminService = {
  getCleanupStatus: async (): Promise<StorageCleanupStatus> => {
    const response = await api.get<StorageCleanupStatus>('/admin/storage/cleanup/status')
    return response.data
  },

  triggerCleanup: async (params?: StorageCleanupRequest): Promise<StorageCleanupResponse> => {
    const response = await api.post<StorageCleanupResponse>('/admin/storage/cleanup', params || {})
    return response.data
  },

  updateConfig: async (
    data: UpdateStorageCleanupConfigRequest
  ): Promise<StorageCleanupStatus> => {
    const response = await api.put<StorageCleanupStatus>(
      '/admin/storage/cleanup/config',
      data
    )
    return response.data
  },
}
