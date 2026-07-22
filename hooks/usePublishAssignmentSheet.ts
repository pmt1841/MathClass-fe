import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentService } from '@/services/assignmentService'

export function usePublishAssignmentSheet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assignmentService.publishAssignmentSheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['assignment-sheets'] })
    }
  })
}
