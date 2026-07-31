import api from '@/lib/axios'

export interface SubmissionDrawingRequest {
  shapeCode: string;
  jsxGraphData: any;
  metadata?: any;
}

export interface SubmissionDrawingResponse {
  id: number;
  submissionId: number;
  shapeCode: string;
  jsxGraphData: any;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export const submissionDrawingService = {
  getSubmissionDrawing: async (submissionId: number): Promise<SubmissionDrawingResponse> => {
    const { data } = await api.get<SubmissionDrawingResponse>(`/submissions/${submissionId}/drawings`);
    return data;
  },

  saveSubmissionDrawing: async (
    submissionId: number, 
    payload: SubmissionDrawingRequest
  ): Promise<SubmissionDrawingResponse> => {
    const { data } = await api.put<SubmissionDrawingResponse>(`/submissions/${submissionId}/drawings`, payload);
    return data;
  }
}
