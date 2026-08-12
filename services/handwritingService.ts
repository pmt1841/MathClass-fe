import api from '@/lib/axios'

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
   * Gọi AI phân tích ảnh chữ viết tay / công thức toán và nhận về mã LaTeX.
   */
  convertHandwritingToLatex: async (imageData: string, mimeType?: string): Promise<HandwritingLatexResponse> => {
    const res = await api.post<HandwritingLatexResponse>('/submissions/ai/handwriting-to-latex', {
      imageData,
      mimeType: mimeType || 'image/png'
    })
    return res.data
  },

  /**
   * Gọi AI phân tích ảnh nét vẽ phác thảo hình học và nhận về JSON cấu trúc hình chuẩn hóa.
   */
  normalizeSketchToGeometry: async (canvasImageData: string, mimeType?: string): Promise<SketchGeometryResponse> => {
    const res = await api.post<SketchGeometryResponse>('/submissions/ai/sketch-to-geometry', {
      canvasImageData,
      mimeType: mimeType || 'image/png'
    })
    return res.data
  }
}
