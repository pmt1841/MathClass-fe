import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubmissionDrawing, saveSubmissionDrawing, SubmissionDrawingRequest } from '../lib/api/submissionDrawingApi';

export const useSubmissionDrawing = (submissionId: number) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['submissionDrawing', submissionId],
    queryFn: () => getSubmissionDrawing(submissionId),
    enabled: !!submissionId,
    retry: false, // Do not retry on 404 (first time user is opening the drawing)
  });

  const mutation = useMutation({
    mutationFn: (payload: SubmissionDrawingRequest) => saveSubmissionDrawing(submissionId, payload),
    onSuccess: () => {
      // Invalidate the cache so the next GET fetches the latest data
      queryClient.invalidateQueries({ queryKey: ['submissionDrawing', submissionId] });
    },
  });

  return {
    drawing: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    saveDrawing: mutation.mutate,
    saveDrawingAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  };
};
