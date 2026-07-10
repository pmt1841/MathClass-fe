import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionDrawingService, SubmissionDrawingRequest } from '@/services/submissionDrawingService';

export const useSubmissionDrawing = (submissionId: number) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['submissionDrawing', submissionId],
    queryFn: () => submissionDrawingService.getSubmissionDrawing(submissionId),
    enabled: !!submissionId,
    retry: false, // Do not retry on 404 (first time user is opening the drawing)
  });

  const mutation = useMutation({
    mutationFn: (payload: SubmissionDrawingRequest) => submissionDrawingService.saveSubmissionDrawing(submissionId, payload),
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
