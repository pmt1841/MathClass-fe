import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/axios'
import {
  submissionDrawingService,
  SubmissionDrawingRequest,
  SubmissionDrawingResponse,
} from '@/services/submissionDrawingService'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe('submissionDrawingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSubmissionDrawing - gọi GET /submissions/:id/drawings và trả về dữ liệu hình vẽ', async () => {
    const mockDrawing: SubmissionDrawingResponse = {
      id: 1,
      submissionId: 100,
      shapeCode: 'TRIANGLE_ABC',
      jsxGraphData: { points: [{ id: 'A', x: 0, y: 0 }, { id: 'B', x: 4, y: 0 }, { id: 'C', x: 0, y: 3 }] },
      metadata: { toolVersion: '1.0' },
      createdAt: '2026-09-11T10:00:00Z',
      updatedAt: '2026-09-11T10:00:00Z',
    }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockDrawing })

    const result = await submissionDrawingService.getSubmissionDrawing(100)

    expect(api.get).toHaveBeenCalledWith('/submissions/100/drawings')
    expect(result).toEqual(mockDrawing)
    expect(result.shapeCode).toBe('TRIANGLE_ABC')
  })

  it('saveSubmissionDrawing - gọi PUT /submissions/:id/drawings lưu dữ liệu hình vẽ', async () => {
    const payload: SubmissionDrawingRequest = {
      shapeCode: 'CIRCLE_O',
      jsxGraphData: { center: [0, 0], radius: 5 },
      metadata: { autoSaved: true },
    }
    const mockSaved: SubmissionDrawingResponse = {
      id: 2,
      submissionId: 101,
      shapeCode: payload.shapeCode,
      jsxGraphData: payload.jsxGraphData,
      metadata: payload.metadata,
      createdAt: '2026-09-11T10:05:00Z',
      updatedAt: '2026-09-11T10:05:00Z',
    }
    vi.mocked(api.put).mockResolvedValueOnce({ data: mockSaved })

    const result = await submissionDrawingService.saveSubmissionDrawing(101, payload)

    expect(api.put).toHaveBeenCalledWith('/submissions/101/drawings', payload)
    expect(result).toEqual(mockSaved)
    expect(result.shapeCode).toBe('CIRCLE_O')
  })
})
