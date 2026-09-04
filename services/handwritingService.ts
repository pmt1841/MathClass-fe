import api from '@/lib/axios'
import { aiJobService } from '@/services/aiJobService'
import { AiJobStatus, AiJobSubmitResponse } from '@/types/aiJob'

export interface HandwritingLatexResponse {
  latex: string
  rawAiOutput: string
}

export interface SketchGeometryResponse {
  shapeType: string
  geometryJson: string
}

export const handwritingService = {
  /**
   * Gọi AI phân tích ảnh chữ viết tay / công thức toán và nhận về mã LaTeX (đồng bộ).
   */
  convertHandwritingToLatex: async (imageData: string, mimeType?: string): Promise<HandwritingLatexResponse> => {
    const res = await api.post<HandwritingLatexResponse>('/submissions/ai/handwriting-to-latex', {
      imageData,
      mimeType: mimeType || 'image/png'
    })
    return res.data
  },

  /**
   * Phân tích ảnh chữ viết tay bất đồng bộ qua Redis Queue.
   */
  convertHandwritingToLatexAsync: async (
    imageData: string,
    mimeType?: string,
    options?: {
      onStatusChange?: (status: AiJobStatus, message?: string) => void
      signal?: AbortSignal
    }
  ): Promise<HandwritingLatexResponse> => {
    const res = await api.post<AiJobSubmitResponse>(
      '/submissions/ai/handwriting-to-latex?async=true',
      {
        imageData,
        mimeType: mimeType || 'image/png',
      },
      { signal: options?.signal }
    )
    return aiJobService.waitForAiJob<HandwritingLatexResponse>(res.data.jobId, {
      onStatusChange: options?.onStatusChange,
      signal: options?.signal,
    })
  },

  /**
   * Gọi AI phân tích ảnh nét vẽ phác thảo hình học và nhận về JSON cấu trúc hình chuẩn hóa (đồng bộ).
   */
  normalizeSketchToGeometry: async (canvasImageData: string, mimeType?: string): Promise<SketchGeometryResponse> => {
    const res = await api.post<SketchGeometryResponse>('/submissions/ai/sketch-to-geometry', {
      canvasImageData,
      mimeType: mimeType || 'image/png'
    })
    return res.data
  },

  /**
   * Nắn chỉnh phác thảo nét vẽ hình học bất đồng bộ qua Redis Queue.
   */
  normalizeSketchToGeometryAsync: async (
    canvasImageData: string,
    mimeType?: string,
    options?: {
      onStatusChange?: (status: AiJobStatus, message?: string) => void
      signal?: AbortSignal
    }
  ): Promise<SketchGeometryResponse> => {
    const res = await api.post<AiJobSubmitResponse>(
      '/submissions/ai/sketch-to-geometry?async=true',
      {
        canvasImageData,
        mimeType: mimeType || 'image/png',
      },
      { signal: options?.signal }
    )
    return aiJobService.waitForAiJob<SketchGeometryResponse>(res.data.jobId, {
      onStatusChange: options?.onStatusChange,
      signal: options?.signal,
    })
  },
}

