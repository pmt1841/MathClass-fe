import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentService, PublishPayload } from '@/services/assignmentService'

export function usePublishAssignment(assignmentId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: PublishPayload) => {
      if (!assignmentId) throw new Error('Assignment ID is required')
      return assignmentService.publishAssignment(assignmentId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    }
  })
}
