import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { libraryService, LibrarySearchParams, UpdateVisibilityPayload } from '@/services/libraryService'

// ─── Query Keys ───────────────────────────────────────────────────────────────

const LIBRARY_KEYS = {
  assignments: (params: LibrarySearchParams) => ['library', 'assignments', params] as const,
  sheets: (params: LibrarySearchParams) => ['library', 'sheets', params] as const,
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Tìm kiếm bài tập đơn lẻ công khai trong thư viện.
 * Cache 2 phút vì dữ liệu thư viện không đổi liên tục.
 */
export function useLibraryAssignments(params: LibrarySearchParams) {
  return useQuery({
    queryKey: LIBRARY_KEYS.assignments(params),
    queryFn: () => libraryService.getPublicAssignments(params),
    staleTime: 2 * 60 * 1000, // 2 phút
  })
}

/**
 * Tìm kiếm phiếu bài tập công khai trong thư viện.
 */
export function useLibrarySheets(params: LibrarySearchParams) {
  return useQuery({
    queryKey: LIBRARY_KEYS.sheets(params),
    queryFn: () => libraryService.getPublicSheets(params),
    staleTime: 2 * 60 * 1000,
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
    },
  })
}
