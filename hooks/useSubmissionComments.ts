import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { submissionService, SubmissionCommentRequest } from '@/services/submissionService'

export const useSubmissionComments = (submissionId: number) => {
  const queryClient = useQueryClient()
  const queryKey = ['submissionComments', submissionId]

  const { data: comments, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => submissionService.getComments(submissionId),
    enabled: !!submissionId
  })

  const addCommentMutation = useMutation({
    mutationFn: (data: SubmissionCommentRequest) => submissionService.addComment(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    }
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => submissionService.deleteComment(submissionId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    }
  })

  return {
    comments,
    isLoading,
    error,
    addComment: addCommentMutation.mutateAsync,
    isAdding: addCommentMutation.isPending,
    deleteComment: deleteCommentMutation.mutateAsync,
    isDeleting: deleteCommentMutation.isPending
  }
}
