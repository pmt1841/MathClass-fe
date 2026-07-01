import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface PublishPayload {
  targets: { classCode: string; deadline: string }[]
}

export function usePublishAssignment(assignmentId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: PublishPayload) => {
      if (!assignmentId) throw new Error('Assignment ID is required')
      const response = await api.put(`/assignments/${assignmentId}/publish`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    }
  })
}
