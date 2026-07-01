import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { submissionApi, SubmissionCommentRequest } from '@/lib/api/submission'

export const useSubmissionComments = (submissionId: number) => {
  const queryClient = useQueryClient()
  const queryKey = ['submissionComments', submissionId]

  const { data: comments, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => submissionApi.getComments(submissionId),
    enabled: !!submissionId
  })

  const addCommentMutation = useMutation({
    mutationFn: (data: SubmissionCommentRequest) => submissionApi.addComment(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    }
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => submissionApi.deleteComment(submissionId, commentId),
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
