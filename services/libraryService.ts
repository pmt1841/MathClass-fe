import api from '@/lib/axios'
import { PageResponse, AssignmentVisibility } from '@/types'
import { AssignmentResponse } from './assignmentService'

// ─── Request / Response Types ────────────────────────────────────────────────

export interface LibrarySearchParams {
  keyword?: string
  page?: number
  size?: number
  /** Kiểm soát khi nào TanStack Query được phép chạy (truyền từ component) */
  enabled?: boolean
}

export interface UpdateVisibilityPayload {
  id: number
  visibility: AssignmentVisibility
  isSheet?: boolean
}

// ─── Library Service ──────────────────────────────────────────────────────────

export const libraryService = {
  /**
   * GET /api/library/assignments
   * Tìm kiếm bài tập đơn lẻ công khai trong thư viện.
   * Yêu cầu permission: library:read
   */
  getPublicAssignments: async (params: LibrarySearchParams): Promise<PageResponse<AssignmentResponse>> => {
    const res = await api.get<PageResponse<AssignmentResponse>>('/library/assignments', { params })
    return res.data
  },

  /**
   * GET /api/library/assignment-sheets
   * Tìm kiếm phiếu bài tập công khai trong thư viện.
   * Yêu cầu permission: library:read
   */
  getPublicSheets: async (params: LibrarySearchParams): Promise<PageResponse<AssignmentResponse>> => {
    const res = await api.get<PageResponse<AssignmentResponse>>('/library/assignment-sheets', { params })
    return res.data
  },

  /**
   * POST /api/library/assignments/:id/clone
   * Clone bài tập đơn lẻ về kho cá nhân.
   * Yêu cầu permission: library:clone
   */
  cloneAssignment: async (id: number, title: string): Promise<AssignmentResponse> => {
    const res = await api.post<AssignmentResponse>(`/library/assignments/${id}/clone`, { title })
    return res.data
  },

  /**
   * POST /api/library/assignment-sheets/:id/clone
   * Clone phiếu bài tập về kho cá nhân.
   * Yêu cầu permission: library:clone
   */
  cloneSheet: async (id: number, title: string): Promise<AssignmentResponse> => {
    const res = await api.post<AssignmentResponse>(`/library/assignment-sheets/${id}/clone`, { title })
    return res.data
  },

  /**
   * PATCH /api/assignments/:id hoặc /api/assignment-sheets/:id
   * Cập nhật trạng thái visibility (PRIVATE | PUBLIC) của bài tập cá nhân.
   */
  updateVisibility: async ({ id, visibility, isSheet = false }: UpdateVisibilityPayload): Promise<AssignmentResponse> => {
    const endpoint = isSheet ? `/assignment-sheets/${id}/visibility` : `/assignments/${id}/visibility`
    const res = await api.patch<AssignmentResponse>(endpoint, { visibility })
    return res.data
  },
}
