import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { libraryService, LibrarySearchParams, UpdateVisibilityPayload } from '@/services/libraryService'

// ─── Query Keys ───────────────────────────────────────────────────────────────

const LIBRARY_KEYS = {
  assignments: (params: LibrarySearchParams) => ['library', 'assignments', params] as const,
  sheets: (params: LibrarySearchParams) => ['library', 'sheets', params] as const,
  detail: (id: number | null) => ['library', 'detail', id] as const,
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Tìm kiếm bài tập đơn lẻ công khai trong thư viện.
 * Cache 2 phút vì dữ liệu thư viện không đổi liên tục.
 */
export function useLibraryAssignments(params: LibrarySearchParams) {
  const { enabled = true, ...queryParams } = params
  return useQuery({
    queryKey: LIBRARY_KEYS.assignments(queryParams),
    queryFn: () => libraryService.getPublicAssignments(queryParams),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled,
  })
}

/**
 * Lấy chi tiết bài tập đơn lẻ công khai từ thư viện.
 */
export function useLibraryAssignmentDetail(id: number | null) {
  return useQuery({
    queryKey: LIBRARY_KEYS.detail(id),
    queryFn: () => libraryService.getPublicAssignmentDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Tìm kiếm phiếu bài tập công khai trong thư viện.
 */
export function useLibrarySheets(params: LibrarySearchParams) {
  const { enabled = true, ...queryParams } = params
  return useQuery({
    queryKey: LIBRARY_KEYS.sheets(queryParams),
    queryFn: () => libraryService.getPublicSheets(queryParams),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Clone bài tập đơn lẻ từ thư viện về kho cá nhân.
 * Invalidate danh sách bài tập cá nhân sau khi clone thành công.
 */
export function useCloneAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      libraryService.cloneAssignment(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['library'] })
    },
  })
}

/**
 * Clone phiếu bài tập từ thư viện về kho cá nhân.
 */
export function useCloneSheet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      libraryService.cloneSheet(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['library'] })
    },
  })
}

/**
 * Cập nhật visibility (PRIVATE | PUBLIC) của bài tập/phiếu cá nhân.
 * Invalidate cache bài tập sau khi update.
 */
export function useUpdateVisibility() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateVisibilityPayload) =>
      libraryService.updateVisibility(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['library'] })
    },
  })
}
