import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import { aiJobService } from '@/services/aiJobService'
import {
  handwritingService,
  HandwritingLatexResponse,
  SketchGeometryResponse,
} from '@/services/handwritingService'

vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock('@/services/aiJobService', () => ({
  aiJobService: {
    waitForAiJob: vi.fn(),
  },
}))

describe('handwritingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('convertHandwritingToLatex (đồng bộ)', () => {
    it('gọi POST /submissions/ai/handwriting-to-latex với mimeType mặc định image/png', async () => {
      const mockResult: HandwritingLatexResponse = {
        latex: '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
        rawAiOutput: 'x = (-b +- sqrt(b^2 - 4ac))/(2a)',
      }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResult })

      const result = await handwritingService.convertHandwritingToLatex('data:image/png;base64,sample')

      expect(api.post).toHaveBeenCalledWith('/submissions/ai/handwriting-to-latex', {
        imageData: 'data:image/png;base64,sample',
        mimeType: 'image/png',
      })
      expect(result).toEqual(mockResult)
      expect(result.latex).toContain('\\frac')
    })

    it('gọi POST với custom mimeType khi được truyền', async () => {
      const mockResult: HandwritingLatexResponse = {
        latex: 'x^2 + y^2 = r^2',
        rawAiOutput: 'x^2 + y^2 = r^2',
      }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResult })

      const result = await handwritingService.convertHandwritingToLatex('data:image/jpeg;base64,sample', 'image/jpeg')

      expect(api.post).toHaveBeenCalledWith('/submissions/ai/handwriting-to-latex', {
        imageData: 'data:image/jpeg;base64,sample',
        mimeType: 'image/jpeg',
      })
      expect(result).toEqual(mockResult)
    })
  })

  describe('convertHandwritingToLatexAsync (bất đồng bộ)', () => {
    it('gọi POST bất đồng bộ và theo dõi tiến trình qua aiJobService', async () => {
      const mockJobSubmit = {
        jobId: 'job-hw-latex-123',
        status: 'PENDING',
      }
      const mockFinalResult: HandwritingLatexResponse = {
        latex: '\\int_{0}^{1} x dx = \\frac{1}{2}',
        rawAiOutput: 'integral from 0 to 1 of x dx = 1/2',
      }

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockJobSubmit })
      vi.mocked(aiJobService.waitForAiJob).mockResolvedValueOnce(mockFinalResult as any)

      const onStatusChange = vi.fn()
      const controller = new AbortController()

      const result = await handwritingService.convertHandwritingToLatexAsync(
        'base64-data',
        'image/webp',
        {
          onStatusChange,
          signal: controller.signal,
        }
      )

      expect(api.post).toHaveBeenCalledWith(
        '/submissions/ai/handwriting-to-latex?async=true',
        {
          imageData: 'base64-data',
          mimeType: 'image/webp',
        },
        { signal: controller.signal }
      )
      expect(aiJobService.waitForAiJob).toHaveBeenCalledWith('job-hw-latex-123', {
        onStatusChange,
        signal: controller.signal,
      })
      expect(result).toEqual(mockFinalResult)
    })
  })

  describe('normalizeSketchToGeometry (đồng bộ)', () => {
    it('gọi POST /submissions/ai/sketch-to-geometry và chuẩn hóa hình phác thảo', async () => {
      const mockResult: SketchGeometryResponse = {
        shapeType: 'CIRCLE',
        geometryJson: JSON.stringify({ cx: 200, cy: 200, r: 50 }),
      }
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResult })

      const result = await handwritingService.normalizeSketchToGeometry('canvas-base64')

      expect(api.post).toHaveBeenCalledWith('/submissions/ai/sketch-to-geometry', {
        canvasImageData: 'canvas-base64',
        mimeType: 'image/png',
      })
      expect(result).toEqual(mockResult)
      expect(result.shapeType).toBe('CIRCLE')
    })
  })

  describe('normalizeSketchToGeometryAsync (bất đồng bộ)', () => {
    it('gọi POST chuẩn hóa nét vẽ bất đồng bộ qua Redis Queue', async () => {
      const mockJobSubmit = {
        jobId: 'job-sketch-456',
        status: 'PENDING',
      }
      const mockFinalResult: SketchGeometryResponse = {
        shapeType: 'TRIANGLE',
        geometryJson: JSON.stringify({ points: [[0, 0], [100, 0], [50, 86]] }),
      }

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockJobSubmit })
      vi.mocked(aiJobService.waitForAiJob).mockResolvedValueOnce(mockFinalResult as any)

      const result = await handwritingService.normalizeSketchToGeometryAsync('canvas-base64-async')

      expect(api.post).toHaveBeenCalledWith(
        '/submissions/ai/sketch-to-geometry?async=true',
        {
          canvasImageData: 'canvas-base64-async',
          mimeType: 'image/png',
        },
        { signal: undefined }
      )
      expect(aiJobService.waitForAiJob).toHaveBeenCalledWith('job-sketch-456', {
        onStatusChange: undefined,
        signal: undefined,
      })
      expect(result.shapeType).toBe('TRIANGLE')
    })
  })
})
