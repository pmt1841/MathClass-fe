import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  bugReportService,
  BugReportResponse,
  BugReportStatus,
  PageResponse,
} from '@/services/bugReportService'

interface UseBugReportsParams {
  status?: BugReportStatus
  page: number
  size: number
}

export function useBugReports({ status, page, size }: UseBugReportsParams) {
  return useQuery<PageResponse<BugReportResponse>>({
    queryKey: ['bug-reports', status, page, size],
    queryFn: async () => {
      const res = await bugReportService.getReports({
        status,
        page,
        size,
      })
      const data: PageResponse<BugReportResponse> = res?.result || res
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useUpdateBugReportStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: BugReportStatus }) =>
      bugReportService.updateReportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] })
    },
  })
}
